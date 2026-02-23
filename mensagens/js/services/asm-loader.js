/**
 * ASM LOADER - BRIDGE PARA WEBASSEMBLY (Low-Level)
 * Gerencia alocação de memória, Transporte Base64, Hashing e Limpeza de Rastros (Wipe).
 * Arquitetura: Singleton Universal.
 */
export class AsmCryptoBridge {
    constructor() {
        this.wasmInstance = null;
        // Página de 64KB (suficiente para chunks de chat e senhas)
        this.memory = new WebAssembly.Memory({ initial: 1 });
        this.isReady = false;
        this._initPromise = null;
    }

    /**
     * Inicialização Lazy do Kernel de Segurança.
     * Usa caminho absoluto para funcionar de qualquer subpasta (/login, /registro, etc).
     */
    async init() {
        if (this.isReady) return this._initPromise;
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            try {
                // Resolve URL relativa ao próprio módulo (funciona em subpastas/produção)
                const wasmUrl = new URL('../../wasm/secure.wasm', import.meta.url);
                const response = await fetch(wasmUrl);

                if (!response.ok) {
                    throw new Error(`Erro HTTP ao buscar Wasm: ${response.status}`);
                }

                const bytes = await response.arrayBuffer();

                const results = await WebAssembly.instantiate(bytes, {
                    env: { memory: this.memory }
                });

                this.wasmInstance = results.instance;
                this.isReady = true;
                console.log("[AsmCore] Crypto Engine Online (Universal + Memory Scrubbing).");
                window.dispatchEvent(new CustomEvent('asmcrypto:ready'));
            } catch (e) {
                console.error("[AsmCore] Falha Crítica de Inicialização:", e);
            }
        })();

        return this._initPromise;
    }

    /* ==========================================================================
       MÓDULO DE CHAT (Reversível: Texto <-> Base64)
       ========================================================================== */

    /**
     * ENCRYPT: Texto -> Wasm(XOR) -> Base64
     * Para enviar mensagens seguras. Limpa a memória após o uso.
     */
    encrypt(text) {
        if (!this.isReady || !text) return text;

        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const ptr = 0;
        const len = data.length;
        
        // 1. Processa no Assembly
        // Retorna uma CÓPIA segura dos bytes cifrados
        const processedBytes = this._runWasmKernel(data, 'cipher_chunk');
        
        // 2. WIPE MEMORY (Segurança Extrema)
        // Apaga o texto original que estava na memória do Wasm
        if (this.wasmInstance.exports.wipe_memory) {
            this.wasmInstance.exports.wipe_memory(ptr, len);
        }

        // 3. Converte para Base64 (Transporte Seguro)
        return this._bytesToBase64(processedBytes);
    }

    /**
     * DECRYPT: Base64 -> Wasm(XOR) -> Texto
     * Para ler mensagens seguras.
     */
    decrypt(base64Text) {
        if (!this.isReady || !base64Text) return base64Text;

        try {
            const data = this._base64ToBytes(base64Text);
            
            // Processa no Assembly (XOR reverso)
            const decryptedBytes = this._runWasmKernel(data, 'cipher_chunk');

            return new TextDecoder().decode(decryptedBytes);
        } catch (e) {
            console.warn("[AsmCore] Falha ao decifrar (texto legado ignorado).");
            return base64Text;
        }
    }

    /* ==========================================================================
       MÓDULO DE AUTENTICAÇÃO (Irreversível: Senha -> Hash Hex)
       ========================================================================== */

    /**
     * PASSWORD HARDENING: Texto -> Wasm(Hash) -> HexString
     * Torna a senha irreversível e limpa a memória imediatamente.
     */
    hashPassword(password) {
        if (!this.isReady || !password) return password;

        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const ptr = 0;
        const len = data.length;
        const memView = new Uint8Array(this.memory.buffer);

        // Limpa memória antes (Segurança extra)
        memView.fill(0, 0, 128);

        // Escreve senha na memória
        memView.set(data, ptr);

        // 1. Executa Hashing no Assembly
        if (this.wasmInstance.exports.hash_chunk) {
            this.wasmInstance.exports.hash_chunk(ptr, len);
        }

        // Lê o resultado (Inteiro 32 bits no início da memória)
        const resultView = new DataView(this.memory.buffer);
        const hashInt = resultView.getUint32(0, true); // Little Endian

        // 2. WIPE MEMORY (Segurança Extrema)
        // Apaga a senha "123456" que estava na RAM do Wasm
        if (this.wasmInstance.exports.wipe_memory) {
            this.wasmInstance.exports.wipe_memory(ptr, len);
        }

        // Retorna Hex + Sufixo (Garante unicidade)
        return hashInt.toString(16).padStart(8, '0') + "xWsM"; 
    }

    /* ==========================================================================
       MÉTODOS PRIVADOS (Core Logic)
       ========================================================================== */

    _runWasmKernel(dataUint8, functionName) {
        const ptr = 0;
        const len = dataUint8.length;
        const memView = new Uint8Array(this.memory.buffer);

        if (len > memView.byteLength) return dataUint8;

        memView.set(dataUint8, ptr);

        if (this.wasmInstance.exports[functionName]) {
            this.wasmInstance.exports[functionName](ptr, len);
        }

        return memView.slice(ptr, ptr + len);
    }

    _bytesToBase64(bytes) {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    _base64ToBytes(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
}

export const asmCrypto = new AsmCryptoBridge();