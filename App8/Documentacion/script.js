// DATA
const projectSteps = [
    {
        category: "Planificación y Diseño",
        items: [
            "Analizar el código actual para la integración de VirtualBox y SSH",
            "Crear Plan de Implementación incluyendo estética 'Premium'",
            "Diseñar el flujo de datos para estadísticas en tiempo real"
        ]
    },
    {
        category: "Implementación Backend",
        items: [
            "Implementar diferenciación de servidores `vbox` vs `ssh`",
            "Añadir función de Escaneo/Sincronización de MVs usando `VBoxManage list vms`",
            "Implementar APIs de Estadísticas Reales (`top` SSH y simulación VBox)",
            "Implementar control de Inicio/Parada/Reinicio para MVs",
            "Implementar `vbox-manager` executeGuestCommand"
        ]
    },
    {
        category: "Implementación Frontend",
        items: [
            "Actualizar lógica de `ServerCard` para diferentes tipos de servidor",
            "Conectar Estadísticas Reales a la UI (barras de CPU/RAM)",
            "Crear componente `CommandExecuteModal` para comandos remotos",
            "Añadir botón 'Terminal' y comandos rápidos",
            "Mejorar la UI a estándares 'Premium'"
        ]
    },
    {
        category: "Verificación",
        items: [
            "Verificar control SSH (Apagar/Reiniciar)",
            "Verificar control MV (Iniciar/Parar/Abrir GUI)",
            "Verificar Ejecución de Comandos (VBox y SSH)"
        ]
    }
];

const userPrompts = [
    {
        id: 1,
        title: "Petición Inicial",
        content: "NO, eso no, quero una aplicacion web, donde puedas gestionar tus servidores, y a poder ser de virtualbox."
    },
    {
        id: 2,
        title: "Petición de Planificación",
        content: "bro implementa el planing"
    },
    {
        id: 3,
        title: "Plan de Despliegue",
        content: "Creame una aplicacion web, sobre documentación de la aplicacion web que te he pedido antes, con todos los pasos y propmpts que te he dado"
    },
    {
        id: 4,
        title: "Requisito Estético",
        content: "He incluso imagenes de la aplicacion"
    },
    {
        id: 5,
        title: "Cambio de Framework",
        content: "Quiero que sea un Html CSS y JAVASCRIPT"
    }
];

const screenshots = [
    {
        src: "images/uploaded_media_1769514036675.png",
        caption: "Resumen del Dashboard - Tarjetas de Servidor"
    },
    {
        src: "images/uploaded_media_1769516472630.png",
        caption: "Modal de Ejecución de Comandos"
    },
    {
        src: "images/uploaded_media_1_1769504704185.png",
        caption: "Monitorización de Máquinas Virtuales"
    },
    {
        src: "images/uploaded_media_1769503303696.png",
        caption: "Interfaz del Prototipo Inicial"
    }
];

// LOGIC

function renderTimeline() {
    const container = document.getElementById('timeline-content');
    if (!container) return;

    container.innerHTML = projectSteps.map(category => `
        <div class="card" style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 20px; color: var(--color-primary); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                ${category.category}
            </h3>
            <ul style="list-style: none; padding: 0;">
                ${category.items.map(item => `
                    <li class="timeline-item">
                        <i data-lucide="check-circle-2" class="timeline-check"></i>
                        <span style="color: var(--text-main);">${item}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

function renderPrompts() {
    const container = document.getElementById('prompts-content');
    if (!container) return;

    container.innerHTML = userPrompts.map(prompt => `
        <div class="card prompt-card">
            <div class="prompt-bar"></div>
            <div class="prompt-header">
                <div class="prompt-icon-box">
                    <i data-lucide="message-square"></i>
                </div>
                <h3 style="font-size: 1.2rem; margin: 0;">${prompt.title}</h3>
            </div>
            <div class="prompt-content">
                <span style="color: #6366f1; margin-right: 8px;">$</span>
                ${prompt.content}
            </div>
        </div>
    `).join('');
}

function renderGallery() {
    const container = document.getElementById('gallery-content');
    if (!container) return;

    container.innerHTML = screenshots.map((shot, index) => `
        <div class="card gallery-card" onclick="openLightbox('${shot.src}')">
            <div class="gallery-img" style="background-image: url('${shot.src}');"></div>
            <div class="gallery-caption">
                <h4>${shot.caption}</h4>
            </div>
        </div>
    `).join('');
}

// Navigation
function navigateTo(targetId) {
    // Update Active Link
    document.querySelectorAll('.nav-item').forEach(el => {
        if (el.dataset.target === targetId) el.classList.add('active');
        else el.classList.remove('active');
    });

    // Show Section
    document.querySelectorAll('.section').forEach(el => {
        el.classList.remove('active');
    });
    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);
}

// Lightbox
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    img.src = src;
    lightbox.classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderTimeline();
    renderPrompts();
    renderGallery();
    lucide.createIcons();

    // Nav Click Listeners
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            navigateTo(target);
        });
    });
});
