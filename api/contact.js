// Serverless Function para o formulário de contato do Vercel
const nodemailer = require('nodemailer');

// ⚠️ Seu e-mail de destino, onde você receberá as mensagens
const DESTINATION_EMAIL = 'tarcisoferreira000@gmail.com'; 

// Cria o transportador Nodemailer usando as variáveis de ambiente do Vercel
const transporter = nodemailer.createTransport({
    // Use 'gmail' ou um serviço de e-mail transacional (ex: SendGrid, Resend)
    service: 'gmail', 
    auth: {
        // As credenciais são lidas das variáveis de ambiente configuradas no Vercel
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
    },
});

module.exports = async (req, res) => {
    // Garante que a função só responda a submissões POST
    if (req.method !== 'POST') {
        res.status(405).send('Método Não Permitido.');
        return;
    }

    const { Nome, Email, Assunto, Mensagem } = req.body;

    // Validação de campos
    if (!Nome || !Email || !Assunto || !Mensagem) {
        res.status(400).send('Todos os campos do formulário são obrigatórios.');
        return;
    }

    try {
        // Envia o e-mail
        await transporter.sendMail({
            // Formato de remetente: "Nome do Usuário" <email@dele.com>
            from: `"${Nome}" <${Email}>`, 
            to: DESTINATION_EMAIL, 
            subject: `[Site Contato] ${Assunto} - De: ${Nome}`,
            html: `
                <h3>Nova Mensagem do Site Alimentando Fases</h3>
                <p><strong>Nome:</strong> ${Nome}</p>
                <p><strong>Email:</strong> ${Email}</p>
                <p><strong>Assunto:</strong> ${Assunto}</p>
                <hr style="border: 1px solid #ddd;">
                <p><strong>Mensagem:</strong></p>
                <p>${Mensagem.replace(/\n/g, '<br>')}</p>
            `,
        });

        // Redirecionamento de Sucesso para o Front-end
        res.writeHead(302, {
            // ⚠️ O Vercel redirecionará para este caminho
            'Location': '/obrigado.html' 
        });
        res.end();

    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        // Em caso de erro, redireciona o usuário para a página de contato com status 500
        res.status(500).send('Falha no envio da mensagem. Tente novamente mais tarde.');
    }
};