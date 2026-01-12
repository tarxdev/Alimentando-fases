export const getRoleBadgeHTML = (user) => {
    if (!user) return '';

    const role = user.role || user.authorRole || 'user';
    const crn = user.crn || user.authorCRN || ''; // Usado para Nutri
    
    // --- 1. MASTER (GOD MODE) ---
    if (role === 'admin_master') {
        return `
            <div class="role-badge-container" title="Fundador & Master">
                <div class="badge-master">
                    <i class="fa-solid fa-crown"></i> MASTER
                </div>
            </div>`;
    }

    // --- 2. NUTRICIONISTA ---
    if (role === 'nutri') {
        const label = crn ? `CRN ${crn}` : 'Nutricionista';
        return `
            <div class="role-badge-container">
                <div class="badge-pro-base badge-nutri" title="Nutricionista Verificado">
                    <i class="fa-solid fa-leaf"></i> <span>${label}</span>
                </div>
            </div>`;
    }

    // --- 3. MÉDICO ---
    if (role === 'doctor') {
        return `
            <div class="role-badge-container">
                <div class="badge-pro-base badge-doctor" title="Médico Verificado">
                    <i class="fa-solid fa-user-doctor"></i> <span>Médico</span>
                </div>
            </div>`;
    }

    // --- 4. ENFERMEIRO ---
    if (role === 'nurse') {
        return `
            <div class="role-badge-container">
                <div class="badge-pro-base badge-nurse" title="Enfermeiro Verificado">
                    <i class="fa-solid fa-user-nurse"></i> <span>Enfermeiro</span>
                </div>
            </div>`;
    }

    // --- 5. PERSONAL TRAINER / ED. FÍSICA ---
    if (role === 'pe_teacher') {
        return `
            <div class="role-badge-container">
                <div class="badge-pro-base badge-pe" title="Profissional de Ed. Física">
                    <i class="fa-solid fa-dumbbell"></i> <span>Personal</span>
                </div>
            </div>`;
    }

    // --- 6. PROFESSOR ---
    if (role === 'teacher') {
        return `
            <div class="role-badge-container">
                <div class="badge-pro-base badge-teacher" title="Professor Verificado">
                    <i class="fa-solid fa-chalkboard-user"></i> <span>Professor</span>
                </div>
            </div>`;
    }

    // --- 7. ESTUDANTE ---
    if (role === 'student') {
        return `
            <div class="role-badge-container" title="Estudante em Formação">
                <span class="badge-student">
                    <i class="fa-solid fa-graduation-cap"></i> Estudante
                </span>
            </div>`;
    }

    return ''; // Usuário comum
};

/**
 * Função Auxiliar para verificar se o usuário é Master
 */
export const isMasterUser = (user) => {
    if (!user) return false;
    const role = user.role || user.authorRole || 'user';
    return role === 'admin_master';
};