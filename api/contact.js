// Serverless Function para o formulário de contato do Vercel
const nodemailer = require('nodemailer');

// ⚠️ Seu e-mail de destino, onde você receberá as mensagens
const DESTINATION_EMAIL = 'tarcisoferreira000@gmail.com'; 

// Cria o transportador Nodemailer usando as configurações do Resend
const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true, // Usa SSL/TLS
    auth: {
        // O nome de usuário para o Resend é sempre 'resend'
        user: 'resend', 
        // A senha é a chave API que você vai configurar no Vercel
        pass: process.env.RESEND_API_KEY, 
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
            from: `"${Nome}" <${Email}>`, // Remetente: o nome do usuário que preencheu o formulário
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
            'Location': '/obrigado.html' 
        });
        res.end();

    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        res.status(500).send('Falha no envio da mensagem. Tente novamente mais tarde.');
    }
};