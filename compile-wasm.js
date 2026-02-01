/* * BUILD SCRIPT - WASM COMPILER
 * Compila arquivos .asm (syntax WebAssembly) para .wasm
 */
const fs = require('fs');
const path = require('path');
const wabtFactory = require('wabt');

// CONFIGURAÇÃO: Agora aponta para o .asm
const INPUT_FILE = path.join(__dirname, 'mensagens', 'wasm', 'secure.asm');
// O Output continua .wasm (para o navegador entender)
const OUTPUT_FILE = path.join(__dirname, 'mensagens', 'wasm', 'secure.wasm');

wabtFactory().then(wabt => {
    try {
        if (!fs.existsSync(INPUT_FILE)) {
            console.error(`[ERRO] Arquivo .asm não encontrado: ${INPUT_FILE}`);
            return;
        }

        console.log(`[BUILD] Lendo arquivo Assembly: ${INPUT_FILE}...`);
        const wasmSource = fs.readFileSync(INPUT_FILE, 'utf8');

        // Parsear o conteúdo (usando o nome .asm para logs de erro)
        const module = wabt.parseWat('secure.asm', wasmSource);

        module.resolveNames();
        module.validate();

        // Gerar o binário final
        const { buffer } = module.toBinary({ log: true, write_debug_names: true });

        fs.writeFileSync(OUTPUT_FILE, Buffer.from(buffer));
        
        console.log(`[SUCESSO] Binário gerado em: ${OUTPUT_FILE}`);
        console.log(`[INFO] O sistema agora usa a extensão .asm na fonte!`);
        
    } catch (error) {
        console.error('[ERRO FATAL] Falha na compilação:', error);
    }
});