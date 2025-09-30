// inspector/static/inspector/js/violations_by_week.js

// Функция для получения CSRF-токена из скрытого поля
function getCSRFToken() {
    const csrfInput = document.querySelector('input[name="csrf-token"]');
    return csrfInput ? csrfInput.value : '';
}

// Выбор/отмена всех чекбоксов нарушений в рамках одной недели
document.querySelectorAll('.select-week').forEach(weekCheckbox => {
    weekCheckbox.addEventListener('change', function() {
        const week = this.getAttribute('data-week');
        const checked = this.checked;
        // Отмечаем или снимаем все чекбоксы .violation-checkbox с соответствующей неделей
        document.querySelectorAll('.violation-checkbox[data-week="' + week + '"]').forEach(chk => {
            chk.checked = checked;
        });
    });
});

// Обработка нажатия на кнопку "Отправить на согласование"
document.getElementById('send-for-approval-btn').addEventListener('click', function() {
    // Собираем все отмеченные нарушения
    const selectedIds = [];
    document.querySelectorAll('.violation-checkbox:checked').forEach(chk => {
        selectedIds.push(chk.value);
    });
    if (selectedIds.length === 0) {
        alert("Не выбрано ни одного нарушения для отправки.");
        return;
    }
    // Формируем данные для отправки
    const formData = new FormData();
    selectedIds.forEach(id => formData.append('ids[]', id));
    // Получаем CSRF-токен
    const csrftoken = getCSRFToken();
    // Отправляем AJAX-запрос на сервер
    fetch("/inspector/send-for-approval/", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken  // добавляем CSRF-токен в заголовки
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // При успешном обновлении перезагружаем страницу, чтобы увидеть изменения
            alert("Выбранные нарушения отправлены на согласование.");
            location.reload();
        } else {
            alert("Ошибка при отправке. Пожалуйста, попробуйте ещё раз.");
        }
    })
    .catch(error => {
        console.error("Ошибка запроса:", error);
        alert("Произошла ошибка. Попробуйте ещё раз позже.");
    });
});
