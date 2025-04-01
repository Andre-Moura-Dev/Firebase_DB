
const firebaseConfig = {
    apiKey: "AIzaSyB_LtzRC7JF3wNlDfxYIjzY6Dug2VKixrU",
    authDomain: "calculadoraobra-bab7b.firebaseapp.com",
    projectId: "calculadoraobra-bab7b",
    storageBucket: "calculadoraobra-bab7b.firebasestorage.app",
    messagingSenderId: "636285425931",
    appId: "1:636285425931:web:73ed66804d003972bb2a0e",
    measurementId: "G-0JV48HN7N1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Referência para o banco de dados
const calculosRef = database.ref('calculos')

// Elementos do DOM
const calcForm = document.getElementById('calcForm');
const resultadoDiv = document.getElementById('resultado');
const custoPorMetroSpan = document.getElementById('custoPorMetro');
const historicoDiv = document.getElementById('historico');
const listaHistorico = document.getElementById('listaHistorico');


// Carrega o histórico ao carregar a página
window.addEventListener('load', carregarHistorico);

// Evento de submit do formulário
calcForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtém os valores do formulário
    const areaTotal = parseFloat(document.getElementById('areaTotal').value);
    const custoMateriais = parseFloat(document.getElementById('custoMateriais').value);
    const custoMaoDeObra = parseFloat(document.getElementById('custoMaoDeObra').value);
    
    // Calcula o custo por metro quadrado
    const custoPorMetroQuadrado = (custoMateriais + custoMaoDeObra) / areaTotal;
    
    // Exibe o resultado
    custoPorMetroSpan.textContent = `R$ ${custoPorMetroQuadrado.toFixed(2)}`;
    resultadoDiv.classList.remove('hidden');
    
    // Salva no Firebase
    salvarCalculo(areaTotal, custoMateriais, custoMaoDeObra, custoPorMetroQuadrado);
});

async function salvarCalculo(areaTotal, custoMateriais, custoMaoDeObra, custoPorMetroQuadrado, dataCalculo) {
    const calculosRef = database.ref('calculos');

    calculosRef.push({
        dataCalculo: dataCalculo,
        areaTotal: areaTotal,
        custoMateriais: custoMateriais,
        custoMaoDeObra: custoMaoDeObra,
        custoPorMetroQuadrado: custoPorMetroQuadrado
    })
    .then(() => {
        console.log('Cálculo Salvo com sucesso!');
    })
    .catch((error) => {
        console.log('Erro ao salvar Cálculo: ', error);
    })  
}

async function carregarHistorico() {
    
    const calculosRef = database.ref('calculos')
    
    try {
        const snapshot = await calculosRef.limitToLast(5).once('value')

        listaHistorico.innerHTML = '';

        if (!snapshot.exists()) {
            return;
        }

        historicoDiv.classList.remove('hidden');

        const calculos = [];
        snapshot.forEach(childSnapshot => {
            calculos.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        calculos.reverse().forEach(calc => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>Data:</strong> ${formatarData(calc.dataCalculo)}<br>
                <strong>Área:</strong> ${calc.areaTotal} m²<br>
                <strong>Materiais:</strong> R$ ${calc.custoMateriais.toFixed(2)}<br>
                <strong>Mão de obra:</strong> R$ ${calc.custoMaoDeObra.toFixed(2)}<br>
                <strong>Custo/m²:</strong> R$ ${calc.custoPorMetroQuadrado.toFixed(2)}
            `;
            listaHistorico.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao carregar Histórico', error)
    }
}

function formatarData(timestamp) {
    if (!timestamp) return 'Data desconhecida';
    
    const data = new Date(timestamp);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
}