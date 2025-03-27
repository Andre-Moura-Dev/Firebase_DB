const auth = firebase.auth();
const database = firebase.database();

// Elementos globais
const appConatiner = document.getElementById('app-container');

// Rotas da Aplicação
const routes = {
    '/login': { template: 'views/login.html', script: initLogin },
    '/register': { template: 'views/register.html', script: initRegister },
    '/dashboard': { template: 'views/dashboard.html', script: initDashboard },
    '/new-calculation': { template: 'views/calculation-form.html', script: initCalctionForm }
};

// Inicializa a aplicação
async function initApp() {
    // Verifica o estado de autenticação
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const path = window.location.pathname.replace(/\/$/, '') || 'dashboard';
            await loadView(path);
        } else {
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.history.pushState({}, '', '/login');
                await loadView('/login');
            } else {
                await loadView(window.location.pathname);
            }
        }
    });

    window.addEventListener('popstate', async () => {
        const path = window.location.pathname.replace(/\/$/, '') || 'dashboard';
        await loadView(path);
    });
}

async function loadView(path) {
    const route = routes[path];

    if(!route) {
        window.history.pushState({}, '', '/dashboard');
        await loadView('/dashboard');
        return;
    }
    try {
        const response = await fetch(route.template);
        const html = await response.text();

        appConatiner.innerHTML = html;

        if (route.script) {
            await route.script();
        }
    } catch(error) {
        console.error('Erro a o carregar a view:', error);
        appConatiner.innerHTML = '<div class="alert alert-error">Erro ao carregar a página. Por favor, tente novamente.</div>';
    }
}

// Navega para uma rota específica
async function navigateTo(path) {
    window.history.pushState({}, '', path);
    await loadView(path);
  }
  
  // Inicializa o formulário de cálculo
  async function initCalculationForm() {
    // Carrega os tipos de projeto
    const projectTypes = await loadProjectTypes();
    
    // Preenche o select de tipos de projeto
    const projectTypeSelect = document.getElementById('projectType');
    if (projectTypeSelect) {
      projectTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        projectTypeSelect.appendChild(option);
      });
    }
  
    // Manipula o envio do formulário
    const form = document.getElementById('calculationForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
          alert('Você precisa estar logado para realizar cálculos.');
          return;
        }
  
        // Obtém os valores do formulário
        const projectName = document.getElementById('projectName').value;
        const projectType = document.getElementById('projectType').value;
        const totalArea = parseFloat(document.getElementById('totalArea').value);
        const materialCost = parseFloat(document.getElementById('materialCost').value);
        const laborCost = parseFloat(document.getElementById('laborCost').value);
        
        // Calcula o custo por m²
        const costPerSquareMeter = (materialCost + laborCost) / totalArea;
        
        // Cria o objeto de projeto
        const projectData = {
          userId: user.uid,
          name: projectName,
          type: projectType,
          totalArea: totalArea,
          createdAt: new Date().toISOString()
        };
        
        // Salva o projeto no Firebase
        const projectRef = await database.ref('projects').push(projectData);
        
        // Cria o objeto de cálculo
        const calculationData = {
          projectId: projectRef.key,
          userId: user.uid,
          materialCost: materialCost,
          laborCost: laborCost,
          costPerSquareMeter: costPerSquareMeter,
          currency: 'BRL',
          createdAt: new Date().toISOString()
        };
        
        // Salva o cálculo no Firebase
        await database.ref('costCalculations').push(calculationData);
        
        // Exibe o resultado
        document.getElementById('resultContainer').classList.remove('hidden');
        document.getElementById('costResult').textContent = costPerSquareMeter.toFixed(2);
        
        // Exibe mensagem de sucesso
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = 'Cálculo salvo com sucesso!';
        form.prepend(alert);
        
        // Limpa o formulário
        form.reset();
      });
    }
}
  
  // Carrega os tipos de projeto do Firebase
  async function loadProjectTypes() {
    const snapshot = await database.ref('projectTypes').once('value');
    const types = [];
    
    snapshot.forEach(childSnapshot => {
      types.push({
        id: childSnapshot.key,
        name: childSnapshot.val()
      });
    });
    
    return types;
}
  
  // Inicializa o dashboard
  async function initDashboard() {
    const user = auth.currentUser;
    if (!user) return;
    
    // Carrega os projetos do usuário
    const projects = await loadUserProjects(user.uid);
    
    // Exibe os projetos na tabela
    const projectsTable = document.getElementById('projectsTable');
    if (projectsTable) {
      const tbody = projectsTable.querySelector('tbody');
      tbody.innerHTML = '';
      
      projects.forEach(project => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${project.name}</td>
          <td>${project.typeName || project.type}</td>
          <td>${project.totalArea} m²</td>
          <td>
            <button class="btn" onclick="viewCalculations('${project.id}')">Ver cálculos</button>
          </td>
        `;
        
        tbody.appendChild(row);
      });
    }
    
    // Adiciona evento ao botão de novo cálculo
    const newCalculationBtn = document.getElementById('newCalculationBtn');
    if (newCalculationBtn) {
      newCalculationBtn.addEventListener('click', () => navigateTo('/new-calculation'));
    }
}
  
  // Carrega os projetos do usuário
  async function loadUserProjects(userId) {
    const snapshot = await database.ref('projects').orderByChild('userId').equalTo(userId).once('value');
    const projects = [];
    
    // Carrega os tipos de projeto para mapeamento
    const projectTypes = await loadProjectTypes();
    
    snapshot.forEach(childSnapshot => {
      const project = childSnapshot.val();
      project.id = childSnapshot.key;
      
      // Adiciona o nome do tipo de projeto
      const type = projectTypes.find(t => t.id === project.type);
      if (type) {
        project.typeName = type.name;
      }
      
      projects.push(project);
    });
    
    return projects;
}
  
  // Inicializa a aplicação quando o DOM estiver carregado
  document.addEventListener('DOMContentLoaded', initApp);
  
  // Expõe funções globais necessárias
  window.navigateTo = navigateTo;
  window.viewCalculations = async function(projectId) {
    // Implementar visualização de cálculos específicos
    alert(`Visualizar cálculos do projeto ${projectId}`);
};