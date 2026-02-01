;; MENSAGENS SECURE CORE - ASSEMBLY (ASM)
;; Autor: Alimentando Fases Security Team
;; Arquitetura: WebAssembly Stack Machine

(module
  ;; Importa a memória do host (JavaScript) - 1 página (64KB)
  (import "env" "memory" (memory 1))

  ;; Chave estática para o Chat (Ofuscação simples)
  (global $key i32 (i32.const 0xAA))

  ;; --- 1. FUNÇÃO DE CHAT (Reversível: XOR) ---
  (func $cipher_chunk (export "cipher_chunk") (param $ptr i32) (param $len i32)
    (local $i i32)
    (local $current_val i32)
    (local $cipher_val i32)

    (local.set $i (i32.const 0))

    (block $break
      (loop $top
        (br_if $break (i32.ge_u (local.get $i) (local.get $len)))

        ;; Calcula endereço e carrega byte
        (local.set $current_val 
          (i32.load8_u (i32.add (local.get $ptr) (local.get $i)))
        )

        ;; XOR simples com a chave global
        (local.set $cipher_val
          (i32.xor (local.get $current_val) (global.get $key))
        )

        ;; Salva de volta na memória
        (i32.store8
          (i32.add (local.get $ptr) (local.get $i))
          (local.get $cipher_val)
        )

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $top)
      )
    )
  )

  ;; --- 2. FUNÇÃO DE LOGIN (Irreversível: Hashing) ---
  (func $hash_chunk (export "hash_chunk") (param $ptr i32) (param $len i32)
    (local $i i32)
    (local $h i32)
    (local $byte i32)

    ;; Inicializa hash com Seed (FNV-1a Offset Basis)
    (local.set $h (i32.const 0x811C9DC5))

    (local.set $i (i32.const 0))
    
    (block $break
      (loop $top
        (br_if $break (i32.ge_u (local.get $i) (local.get $len)))

        ;; Lê o byte da senha
        (local.set $byte (i32.load8_u (i32.add (local.get $ptr) (local.get $i))))

        ;; ALGORITMO DE MIXAGEM (Trituração)
        ;; h = h ^ byte
        (local.set $h (i32.xor (local.get $h) (local.get $byte)))
        
        ;; h = h * 16777619 (Prime)
        (local.set $h (i32.mul (local.get $h) (i32.const 16777619)))
        
        ;; Rotação de bits para ofuscação extra
        (local.set $h 
            (i32.or 
                (i32.shl (local.get $h) (i32.const 13))
                (i32.shr_u (local.get $h) (i32.const 19))
            )
        )

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $top)
      )
    )

    ;; Escreve o Hash final (32 bits) no início da memória
    (i32.store (local.get $ptr) (local.get $h))
  )

  ;; --- 3. FUNÇÃO DE LIMPEZA (WIPE MEMORY) ---
  ;; Zera a memória para evitar Dump de RAM após o uso
  (func $wipe_memory (export "wipe_memory") (param $ptr i32) (param $len i32)
    (local $i i32)
    (local.set $i (i32.const 0))
    (block $break
      (loop $top
        (br_if $break (i32.ge_u (local.get $i) (local.get $len)))
        
        ;; Escreve ZERO no byte atual (Apaga o rastro)
        (i32.store8 
          (i32.add (local.get $ptr) (local.get $i))
          (i32.const 0)
        )
        
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $top)
      )
    )
  )
)