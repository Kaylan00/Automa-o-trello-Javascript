document.addEventListener('DOMContentLoaded', async function () {
    const key = 'SUA_CHAVE_API';
    const token = 'SEU_TOKEN';
    
    const boardId = 'ID_DO_SEU_BOARD';
    const boardTitleElement = document.getElementById('board-title');

    const boardName = await getBoardName(key, token, boardId);
    boardTitleElement.textContent = `Board selecionado: ${boardName}`;

    const listaSelector = document.getElementById('listao');
    await loadLists(key, token, boardId, listaSelector);
});

let checklistItems = [];

async function getBoardName(key, token, boardId) {
    const url = `https://api.trello.com/1/boards/${boardId}?key=${key}&token=${token}`;
    try {
        const response = await fetch(url);
        const board = await response.json();
        return board.name;
    } catch (error) {
        console.error('Erro ao obter o nome do board:', error);
        return 'Nome do board não disponível';
    }
}

async function loadLists(key, token, boardId, listaSelector) {
    const urlLists = `https://api.trello.com/1/boards/${boardId}/lists?key=${key}&token=${token}`;
    const urlLabels = `https://api.trello.com/1/boards/${boardId}/labels?key=${key}&token=${token}`;

    try {
        const [responseLists, responseLabels] = await Promise.all([fetch(urlLists), fetch(urlLabels)]);
        const lists = await responseLists.json();
        const labels = await responseLabels.json();

        lists.forEach(list => {
            const option = document.createElement('option');
            option.value = list.id;
            option.textContent = list.name;
            listaSelector.appendChild(option);
        });

        const etiquetaSelector = document.getElementById('etiqueta');

        // Adicionando a opção "Nenhuma etiqueta"
        const noneOption = document.createElement('option');
        noneOption.value = ''; // Valor vazio
        noneOption.textContent = 'Nenhuma etiqueta';
        noneOption.selected = true; // Definir como selecionada por padrão
        etiquetaSelector.appendChild(noneOption);

        labels.forEach(label => {
            const option = document.createElement('option');
            option.value = label.id;
            option.textContent = label.color;
            etiquetaSelector.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar listas e etiquetas:', error);
    }
}

async function createCard() {
    const key = 'SUA_CHAVE_API';
    const token = 'SEU_TOKEN';
    
    // Verificar se o elemento listao está presente no HTML
    const listaIdElement = document.getElementById('listao');
    if (!listaIdElement) {
        console.error('Elemento com ID "listao" não encontrado.');
        return;
    }
    
    const listaId = listaIdElement.value;

    const tituloInput = document.getElementById('titulo');
    const descricaoInput = document.getElementById('descricao');
    const etiquetaId = document.getElementById('etiqueta').value; 

    const titulo = tituloInput.value.trim();
    if (!titulo) {
        alert('O título do card é obrigatório!');
        return;
    }

    try {
        const url = `https://api.trello.com/1/cards?key=${key}&token=${token}&idList=${listaId}&name=${encodeURIComponent(titulo)}&desc=${encodeURIComponent(descricaoInput.value)}&idLabels=${etiquetaId}`;

        const response = await fetch(url, { method: 'POST' });
        const cardData = await response.json();
        
        console.log('Card criado com sucesso:', cardData);
        alert('Card criado com sucesso!');
        
        tituloInput.value = '';
        descricaoInput.value = '';
        document.getElementById('etiqueta').selectedIndex = 0; // Definir a opção "Nenhuma etiqueta" como selecionada
        
        if (checklistItems.length > 0) {
            await adicionarItensAoChecklist(cardData.id, checklistItems, key, token);
            checklistItems = []; 
            updateChecklistDisplay(); 
        }
        
        const fileInput = document.getElementById('anexo');
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const attachmentsUrl = `https://api.trello.com/1/cards/${cardData.id}/attachments?key=${key}&token=${token}`;
            const attachmentsResponse = await fetch(attachmentsUrl, {
                method: 'POST',
                body: formData
            });

            if (attachmentsResponse.ok) {
                console.log('Anexo adicionado como capa do card.');
            } else {
                console.error('Erro ao adicionar anexo como capa do card:', attachmentsResponse.statusText);
                alert('Erro ao adicionar anexo como capa do card. Verifique o console para mais detalhes.');
            }
        }
    } catch (error) {
        console.error('Erro ao criar card:', error);
        alert('Erro ao criar card. Verifique o console para mais detalhes.');
    }
}
async function addAttachmentToCard(cardId, urlAnexo, key, token) {
    try {
        const url = `https://api.trello.com/1/cards/${cardId}/attachments?key=${key}&token=${token}&url=${encodeURIComponent(urlAnexo)}`;
        const response = await fetch(url, { method: 'POST' });
        const attachmentData = await response.json();
        
        console.log('Anexo adicionado com sucesso:', attachmentData);
        alert('Anexo adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar anexo ao card:', error);
        alert('Erro ao adicionar anexo ao card. Verifique o console para mais detalhes.');
    }
}


function adicionarChecklist() {
    const checklistInput = document.getElementById('checklist');
    const itemName = checklistInput.value.trim();

    if (itemName === '') {
        alert('Digite o nome do item do checklist.');
        return;
    }

    checklistItems.push(itemName);
    checklistInput.value = ''; 

    updateChecklistDisplay(); 
}

function removerItem(index) {
    checklistItems.splice(index, 1);
    updateChecklistDisplay(); 
}

function updateChecklistDisplay() {
    const checklistContainer = document.getElementById('checklist-container');
    checklistContainer.innerHTML = ''; 

    checklistItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.textContent = `${index + 1}. ${item}`;
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.onclick = () => removerItem(index);
        
        itemElement.appendChild(deleteButton);
        checklistContainer.appendChild(itemElement);
    });
}

async function adicionarItensAoChecklist(cardId, items, key, token) {
    const url = `https://api.trello.com/1/checklists?idCard=${cardId}&key=${key}&token=${token}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Checklist' 
            })
        });

        const checklistData = await response.json();

        const checklistId = checklistData.id;
        const checkItemUrl = `https://api.trello.com/1/checklists/${checklistId}/checkItems?key=${key}&token=${token}`;

        for (const item of items) {
            const itemData = {
                name: item,
                checked: false
            };

            await fetch(checkItemUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            });
        }

        console.log('Itens do checklist adicionados com sucesso.');
    } catch (error) {
        console.error('Erro ao adicionar itens ao checklist:', error);
        alert('Erro ao adicionar itens ao checklist. Verifique o console para mais detalhes.');
    }
}

function showImage(input) {
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const imagePreview = document.getElementById('image-preview');
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
    }

    reader.readAsDataURL(file);
}