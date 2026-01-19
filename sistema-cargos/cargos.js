/* ARQUIVO: sistema-cargos/cargos.js */

/**
 * GERA O HTML DO BADGE (PÍLULA) BASEADO NO CARGO DO BANCO
 */
export const getRoleBadgeHTML = (user) => {
    if (!user) return '';

    // Prioriza 'role' ou 'authorRole' vindo do banco
    const role = user.role || user.authorRole || 'user';
    const crn = user.crn || user.authorCRN || ''; 

    let badgeHTML = '';

    switch (role) {
        case 'admin_master':
            badgeHTML = `
                <div class="role-badge role-master" title="Fundador & Master">
                    <i class="fa-solid fa-crown"></i> <span>MASTER</span>
                </div>`;
            break;

        case 'nutri':
            badgeHTML = `
                <div class="role-badge role-nutri" title="Nutricionista Verificado">
                    <i class="fa-solid fa-leaf"></i> <span>Nutricionista</span>
                </div>`;
            break;

        case 'doctor':
            badgeHTML = `
                <div class="role-badge role-doctor" title="Médico Verificado">
                    <i class="fa-solid fa-user-doctor"></i> <span>Médico</span>
                </div>`;
            break;

        case 'nurse':
            badgeHTML = `
                <div class="role-badge role-nurse" title="Enfermeiro Verificado">
                    <i class="fa-solid fa-user-nurse"></i> <span>Enfermeiro</span>
                </div>`;
            break;

        case 'pe_teacher':
            badgeHTML = `
                <div class="role-badge role-pe" title="Profissional Ed. Física">
                    <i class="fa-solid fa-dumbbell"></i> <span>Personal</span>
                </div>`;
            break;

        case 'teacher':
            badgeHTML = `
                <div class="role-badge role-teacher" title="Professor">
                    <i class="fa-solid fa-chalkboard-user"></i> <span>Professor</span>
                </div>`;
            break;

        case 'student':
            badgeHTML = `
                <div class="role-badge role-student" title="Estudante">
                    <i class="fa-solid fa-graduation-cap"></i> <span>Estudante</span>
                </div>`;
            break;

        default:
            return ''; 
    }

    return `<div class="role-badge-container">${badgeHTML}</div>`;
};

/**
 * Verifica permissão de MASTER apenas pelo cargo no banco
 */
export const isMasterUser = (user) => {
    if (!user) return false;
    const role = user.role || user.authorRole || 'user';
    return role === 'admin_master';
};