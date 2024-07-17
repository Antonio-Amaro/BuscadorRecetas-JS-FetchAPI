document.addEventListener('DOMContentLoaded', startApp);

function startApp() {

    const categoriesSelect = document.querySelector('#categorias');
    const result = document.querySelector('#resultado');
    
    if( categoriesSelect ) {
        categoriesSelect.addEventListener('change', selectCategory);
        getCategories();
    }

    const favsDiv = document.querySelector('.favoritos');
    if(favsDiv) {
        getFavs();
    }

    const modal = new bootstrap.Modal('#modal', {});

    function getCategories() {

        const urlCategories = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        
        fetch(urlCategories)
            .then( response => {
                return response.json();
            })
            .then( data => {
                populateSelect(data.categories)
            })

    }

    function populateSelect(categories = []) {
    
        categories.forEach( category => {

            const { strCategory } = category

            const option = document.createElement('OPTION');
            option.value = strCategory;
            option.textContent = strCategory;
    
            categoriesSelect.appendChild(option);
        });
    }

    function selectCategory(e) {
        const category = e.target.value;
        const urlMeals = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`

        fetch(urlMeals)
            .then( response => {
                return response.json();
            })
            .then( data => {
                showMeals(data.meals);
            })
    }

    function showMeals(meals) {

        clearHTML(result);

        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = meals.length ? 'Recetas' : 'No hay recetas'; 
        result.appendChild(heading);

        meals.forEach(meal => {
            const { strMeal, strMealThumb, idMeal } = meal;

            const mealContainer = document.createElement('DIV');
            mealContainer.classList.add('col-sm-6', 'col-md-4', 'col-lg-3');

            const mealCard = document.createElement('DIV');
            mealCard.classList.add('card', 'mb-4');

            const mealImage = document.createElement('IMG');
            mealImage.classList.add('card-img-top');
            mealImage.alt = `Imagen de ${strMeal ?? meal.title}`
            mealImage.src = strMealThumb ?? meal.img;

            const mealCardBody = document.createElement('DIV');
            mealCardBody.classList.add('card-body');

            const mealHeading = document.createElement('H4');
            mealHeading.classList.add('card-title', 'mb-3');
            mealHeading.textContent = strMeal ?? meal.title;

            const mealButton = document.createElement('BUTTON');
            mealButton.classList.add('btn', 'btn-danger', 'w-100');
            mealButton.textContent = 'Ver receta';
            // mealButton.dataset.bsTarget = '#modal';
            // mealButton.dataset.bsToggle = 'modal';
            mealButton.onclick = function() {
                getRecipe(idMeal)
            }

            mealCardBody.appendChild(mealHeading);
            mealCardBody.appendChild(mealButton);
            mealCard.appendChild(mealImage);
            mealCard.appendChild(mealCardBody);
            mealContainer.appendChild(mealCard);

            result.appendChild(mealContainer)
        })
    }

    function getRecipe(id) {
        const urlRecipe = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;

        fetch(urlRecipe)
            .then( response => {
                return response.json()
            })
            .then( data => showRecipe(data.meals[0]))
    }

    function showRecipe(recipe) {

        const { idMeal, strInstructions, strMeal, strMealThumb } = recipe;

        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');

        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="Imagen de receta ${strMeal}" />
            <h3 class="my-3">Instrucciones</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes y Cantidades: </h3>
        `;

        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');

        // Mostrar cantidades e ingredientes
        for(let i = 1; i <= 20; i++) {
            if(recipe[`strIngredient${i}`]) {
                const ingredient = recipe[`strIngredient${i}`];
                const quantity = recipe[`strMeasure${i}`];

                const ingredientItem = document.createElement('LI');
                ingredientItem.classList.add('list-group-item');
                ingredientItem.textContent = `${ingredient} - ${quantity}`;

                listGroup.appendChild(ingredientItem);
            }
        }

        modalBody.appendChild(listGroup);

        const modalFooter = document.querySelector('.modal-footer');
        clearHTML(modalFooter);

        // Botones de cerrar y favorito
        const btnFavs = document.createElement('BUTTON');
        btnFavs.classList.add('btn', 'btn-danger', 'col');
        btnFavs.textContent = storageExists(idMeal) ? 'Eliminar Favorito' : 'Guardar Favorito';

        // LocalStorage
        btnFavs.onclick = function() {

            if(storageExists(idMeal)) {
                deleteFavs(idMeal);
                btnFavs.textContent = 'Guardar Favorito';
                showToast('Receta eliminada de Favoritos');

                return;
            }

            addFavs({
                id: idMeal,
                title: strMeal,
                img: strMealThumb
            });
            btnFavs.textContent = 'Eliminar Favorito';
            showToast('Receta agregada a Favoritos');

        }

        const btnClose= document.createElement('BUTTON');
        btnClose.classList.add('btn', 'btn-secondary', 'col');
        btnClose.textContent = 'Cerrar';
        btnClose.onclick = function() {
            modal.hide()
        }

        modalFooter.appendChild(btnFavs);
        modalFooter.appendChild(btnClose);
        
        // Mostrar el modal
        modal.show();
    }

    function addFavs(recipe) {
        const favs = JSON.parse(localStorage.getItem('favs')) ?? [];

        localStorage.setItem('favs', JSON.stringify([...favs, recipe]));
    }

    function deleteFavs(id) {
        const favs = JSON.parse(localStorage.getItem('favs')) ?? [];
        const newFavs = favs.filter(fav => fav.id !== id);

        localStorage.setItem('favs', JSON.stringify(newFavs));
    }

    function showToast(mensaje) {
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);
        toastBody.textContent = mensaje
        
        toast.show();
    }

    function storageExists(id) {
        const favs = JSON.parse(localStorage.getItem('favs')) ?? [];

        return favs.some(fav => fav.id === id);
    } 

    function getFavs() {
        const favs = JSON.parse(localStorage.getItem('favs')) ?? [];

        if(favs.length) {
            showMeals(favs);
            return;
        }

        const noFavs = document.createElement('P');
        noFavs.textContent = 'Aún no has agregado Recetas a Favoritos';
        noFavs.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
        favsDiv.appendChild(noFavs);
    }

    function clearHTML(selector) {
        while(selector.firstChild) {
            selector.removeChild(selector.firstChild)
        }
    }
}