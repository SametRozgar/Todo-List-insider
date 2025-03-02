document.addEventListener("DOMContentLoaded", () => {
 
    const todoForm = document.getElementById("todo-form");
    const todoContainer = document.querySelector(".todo-container");
    const filterCompletedButton = document.getElementById("filter-completed");
    const filterIncompleteButton = document.getElementById("filter-incomplete");
    const filterAllButton = document.getElementById("filter-all");
    const sortPrioritySelect = document.getElementById("sort-priority");
    const cancelEditButton = document.getElementById("cancel-edit-button");
    const addTodoButton = document.getElementById("add-todo-button");
    const titleInput = document.getElementById("todo-title-input");
    const descriptionInput = document.getElementById("todo-description-input");

    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    let editingTodoId = null;

 
    const priorityLevels = { "High": 3, "Medium": 2, "Low": 1 };

    todoForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const priority = document.querySelector('input[name="priority"]:checked')?.value;

        if (!title || !priority) {
            alert("Lütfen zorunlu alanları doldurun!");
            return;
        }

        if (editingTodoId) {
         
            const index = todos.findIndex(todo => todo.id === editingTodoId);
            todos[index] = { 
                ...todos[index], 
                title, 
                description, 
                priority 
            };
            exitEditMode();
        } else {
           
            todos.push({
                id: Date.now(),
                title,
                description,
                priority,
                completed: false
            });
        }

        saveToLocalStorage();
        renderTodos();
        todoForm.reset();
    });

  
    function renderTodos(filteredTodos = todos) {
        todoContainer.innerHTML = "";
        
        filteredTodos.forEach(todo => {
            const todoElement = document.createElement("div");
            todoElement.className = `todo-item ${todo.completed ? "completed" : ""}`;
            todoElement.dataset.id = todo.id;
            todoElement.draggable = true;

            todoElement.innerHTML = `
                <h3>${todo.title}</h3>
                <p>${todo.description}</p>
                <p><strong>Öncelik:</strong> ${todo.priority}</p>
                <div class="todo-actions">
                    <button class="toggle-complete">${todo.completed ? "Tamamlanmadı" : "Tamamlandı"}</button>
                    <button class="edit-todo">Düzenle</button>
                    <button class="delete-todo">Sil</button>
                </div>
            `;

      
            todoElement.addEventListener("dragstart", () => {
                todoElement.classList.add("dragging");
            });

            todoElement.addEventListener("dragend", () => {
                todoElement.classList.remove("dragging");
                updateTodoOrder();
            });

            todoContainer.appendChild(todoElement);
        });
    }


    function updateTodoOrder() {
        const newOrder = Array.from(todoContainer.children).map(child => 
            parseInt(child.dataset.id)
        );
        todos = newOrder.map(id => 
            todos.find(todo => todo.id === id)
        ).filter(todo => todo);
        saveToLocalStorage();
    }


    todoContainer.addEventListener("click", (event) => {
        const todoElement = event.target.closest(".todo-item");
        if (!todoElement) return;
        
        const todoId = parseInt(todoElement.dataset.id);

        if (event.target.classList.contains("toggle-complete")) {
            toggleTodoStatus(todoId);
        } else if (event.target.classList.contains("delete-todo")) {
            deleteTodo(todoId);
        } else if (event.target.classList.contains("edit-todo")) {
            enterEditMode(todoId);
        }
    });


    todoContainer.addEventListener("dragover", (event) => {
        event.preventDefault();
        const draggingElement = document.querySelector(".dragging");
        const afterElement = getDragAfterElement(todoContainer, event.clientY);

        if (afterElement == null) {
            todoContainer.appendChild(draggingElement);
        } else {
            todoContainer.insertBefore(draggingElement, afterElement);
        }
    });

 
    function getDragAfterElement(container, y) {
        const elements = [...container.querySelectorAll(".todo-item:not(.dragging)")];

        return elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            return offset < 0 && offset > closest.offset ? 
                { offset: offset, element: child } : 
                closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function toggleTodoStatus(id) {
        todos = todos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveToLocalStorage();
        renderTodos();
    }

    function deleteTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        saveToLocalStorage();
        renderTodos();
    }

    function enterEditMode(id) {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        editingTodoId = id;
        titleInput.value = todo.title;
        descriptionInput.value = todo.description;
        document.querySelector(`input[name="priority"][value="${todo.priority}"]`).checked = true;
        addTodoButton.textContent = "Güncelle";
        cancelEditButton.style.display = "inline-block";
    }

    function exitEditMode() {
        editingTodoId = null;
        addTodoButton.textContent = "Ekle";
        cancelEditButton.style.display = "none";
    }

    function saveToLocalStorage() {
        localStorage.setItem("todos", JSON.stringify(todos));
    }

  
    filterCompletedButton.addEventListener("click", () => 
        renderTodos(todos.filter(todo => todo.completed))
    );

    filterIncompleteButton.addEventListener("click", () => 
        renderTodos(todos.filter(todo => !todo.completed))
    );

    filterAllButton.addEventListener("click", () => renderTodos());

    sortPrioritySelect.addEventListener("change", () => {
        const sortValue = sortPrioritySelect.value;
        todos.sort((a, b) => 
            sortValue === "high-low" ? 
            priorityLevels[b.priority] - priorityLevels[a.priority] : 
            priorityLevels[a.priority] - priorityLevels[b.priority]
        );
        renderTodos();
    });

    cancelEditButton.addEventListener("click", exitEditMode);

    renderTodos();
});