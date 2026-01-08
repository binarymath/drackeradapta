
/**
 * Generates the HTML string for the Member PDF.
 * @param {Object} member - The member object.
 * @param {Array} trails - The trails (archetypes/questions) configuration.
 * @returns {string} - The complete HTML string.
 */
export const generatePDFHTML = (member, trails) => {
    // Dynamic trails directly from state
    // We assume 'trails' structure matches what getTrails returned, or is the raw list
    // If trails is the list of questions, we just use it.

    // Sort/Filter trails if needed (e.g. by type although dynamic trails might just be a flat list)
    // The defaultArchetypes.js structure has 'select' and 'text' types? 
    // Let's assume 'trails' passed here is the array of all questions.

    // Filtering might be needed if structure changed. 
    // In defaultArchetypes, 'trails' is an array of objects with { id, type, ... }
    const selectTrails = trails.filter(t => t.type === 'select');
    const textTrails = trails.filter(t => t.type === 'text');

    const rows = [];
    for (let i = 0; i < selectTrails.length; i += 3) {
        rows.push(selectTrails.slice(i, i + 3));
    }

    // Helper to safely get text value
    const getValue = (value) => {
        if (!value) return 'Não informado';
        if (typeof value === 'object') return value.label || value.text || 'Não informado';
        return value;
    };

    const styles = `
        /* Removed @import to prevent html2canvas timeout issues */
        /* @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap'); */
        @page { size: A4; margin: 15mm; }
        
        * { box-sizing: border-box; }
        
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', sans-serif; 
            color: #2c1810; 
            background: white; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            font-size: 11pt;
            line-height: 1.4;
        }
        
        .container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
        }
        
        /* Header */
        .header { 
            background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
            color: white;
            padding: 20px 25px;
            margin-bottom: 25px;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .header-title h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header-subtitle { margin-top: 2px; font-size: 13px; opacity: 0.9; font-weight: 500; }
        
        .header-date { text-align: right; }
        .header-date-label { font-size: 10px; text-transform: uppercase; opacity: 0.8; font-weight: 600; }
        .header-date-value { font-size: 16px; font-weight: 700; }
        
        /* Profile Card */
        .profile-card {
            display: flex;
            gap: 25px;
            margin-bottom: 30px;
            align-items: center;
            padding: 20px;
            background: #fff;
            border: 2px solid #fcf7f4;
            border-radius: 16px;
        }
        
        .avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid #78350f;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff7ed;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { font-size: 40px; font-weight: 800; color: #9a3412; }
        
        .profile-info { flex: 1; }
        
        .explorer-name { 
            margin: 0 0 8px 0; 
            font-size: 28px; 
            color: #78350f; 
            font-weight: 800;
            line-height: 1.1;
        }
        
        .archetype-badge {
            background: #fefce8;
            color: #854d0e;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 13px;
            display: inline-block;
            border: 2px solid #fde047;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .archetype-desc {
            font-size: 14px;
            color: #666;
            font-style: italic;
            border-left: 3px solid #e5e7eb;
            padding-left: 10px;
            margin-top: 5px;
        }

        .section-title {
            font-size: 14px;
            font-weight: 800;
            color: #78350f;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #fed7aa;
            padding-bottom: 8px;
            margin: 30px 0 15px 0;
        }

        /* Attributes Grid */
        .attributes-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 10px;
        }
        
        .attribute-card {
            background: #fff7ed; /* Orange-50 */
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #ffedd5;
        }
        
        .attribute-label { 
            font-size: 10px; 
            font-weight: 700; 
            color: #9a3412; /* Orange-800 */
            text-transform: uppercase; 
            margin-bottom: 4px;
            letter-spacing: 0.5px;
        }
        
        .attribute-value { font-size: 14px; font-weight: 600; color: #431407; /* Orange-950 */ line-height: 1.3; }
        .attribute-feedback { 
            font-size: 11px; 
            color: #c2410c; /* Orange-700 */
            margin-top: 6px; 
            padding-top: 6px;
            border-top: 1px dashed #fdba74;
            font-style: italic;
        }
        
        /* Text Fields */
        .text-field {
            background: #fefce8; /* Yellow-50 */
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #fef9c3;
            margin-bottom: 12px;
        }
        
        .text-field-label { 
            color: #854d0e; /* Yellow-800 */
            font-size: 10px; 
            font-weight: 700; 
            text-transform: uppercase; 
            margin-bottom: 6px;
        }
        
        .text-field-value { 
            color: #422006; /* Yellow-950 */
            font-size: 13px; 
            white-space: pre-wrap; 
            line-height: 1.5;
        }
        
        /* Diary */
        .diary-section { margin-top: 10px; }
        .diary-entry {
            margin-bottom: 15px;
            background: #fff;
            border: 1px solid #e7e5e4;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .diary-header {
            font-size: 11px;
            font-weight: 700;
            color: #44403c;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
            border-bottom: 1px solid #f5f5f4;
            padding-bottom: 8px;
        }
        
        .diary-meta { color: #78716c; font-weight: 400; }
        .diary-text { font-size: 13px; color: #292524; white-space: pre-wrap; line-height: 1.5; }

        .signatures-wrapper {
            width: 100%;
            margin-top: 50px;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
            display: table; /* Force block context */
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            padding-top: 20px;
            gap: 40px;
        }
        
        .signature-box {
            flex: 1;
            text-align: center;
        }
        
        .signature-line {
            width: 100%;
            height: 40px;
            border-bottom: 2px solid #2c1810;
            margin-bottom: 10px;
        }
        
        .signature-label {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 800;
            color: #78350f;
            letter-spacing: 1px;
        }
        
        .signature-sublabel {
            font-size: 10px;
            color: #6b7280;
            margin-top: 4px;
        }
        
        .page-break { page-break-before: always; }
        .no-break { page-break-inside: avoid; }
    `;

    return `
        <style>${styles}</style>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="header-title">
                        <h1>🗺️ Ficha de Explorador</h1>
                        <div class="header-subtitle">Expedição Drácker • Registro Oficial</div>
                    </div>
                    <div class="header-date">
                        <div class="header-date-label">Data de Emissão</div>
                        <div class="header-date-value">${member.date || new Date().toLocaleDateString('pt-BR')}</div>
                    </div>
                </div>
            </div>

            <!-- Profile Card -->
            <div class="profile-card">
                <div class="avatar-container">
                    <div class="avatar">
                        ${member.photo
            ? `<img src="${member.photo}" alt="${member.name}" crossorigin="anonymous">`
            : `<div class="avatar-placeholder">${member.name ? member.name[0].toUpperCase() : '?'}</div>`
        }
                    </div>
                </div>
                <div class="profile-info">
                    <h2 class="explorer-name">${member.name || 'Explorador'}</h2>
                    <div class="archetype-badge">${member.archetype?.title || 'Arquétipo Não Definido'}</div>
                    ${member.archetype?.desc ? `<div class="archetype-desc">"${member.archetype.desc}"</div>` : ''}
                </div>
            </div>

            <!-- Attributes Section -->
            ${selectTrails.length > 0 ? `
            <div class="no-break">
                <h3 class="section-title">Habilidades & Traços</h3>
                <div class="attributes-grid">
                    ${selectTrails.map(trail => `
                        <div class="attribute-card">
                            <div class="attribute-label">${trail.title}</div>
                            <div class="attribute-value">${getValue(member.answers?.[trail.id])}</div>
                            ${member.answers?.[trail.id]?.feedback
                ? `<div class="attribute-feedback">${member.answers[trail.id].feedback}</div>`
                : ''
            }
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Text Fields Section -->
            ${textTrails.length > 0 ? `
            <div class="no-break">
                <h3 class="section-title">Informações Complementares</h3>
                ${textTrails.map(trail => `
                    <div class="text-field">
                        <div class="text-field-label">${trail.title}</div>
                        <div class="text-field-value">${getValue(member.answers?.[trail.id])}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Diary Section -->
            ${member.registry && member.registry.length > 0 ? `
            <div class="diary-section">
                <h3 class="section-title">Diário de Bordo</h3>
                ${member.registry.map(log => `
                    <div class="diary-entry">
                        <div class="diary-header">
                            📅 ${log.date}
                            <span class="diary-meta">
                                • ${log.responsible || 'Professor'}
                                ${log.subject ? ` • ${log.subject}` : ''}
                            </span>
                        </div>
                        <div class="diary-text">${log.text}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Signatures -->
            <div class="signatures-wrapper">
                <div class="signatures">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Guia / Educador</div>
                        <div class="signature-sublabel">Assinatura e Carimbo</div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Responsável</div>
                        <div class="signature-sublabel">Assinatura e Data</div>
                    </div>
                </div>
            </div>
        </div>
    `;
};
