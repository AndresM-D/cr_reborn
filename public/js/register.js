(function () {
    'use strict';
    window.addEventListener('load', function () {
        let forms = document.getElementsByClassName('needs-validation');
        let validation = Array.prototype.filter.call(forms, function (form) {
            form.addEventListener('submit', function (event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }, false);
})();

$('#btn_submit').click(function () {
    $.ajax({
        url: '/app',
        type: 'POST',
        cache: false,
        data: {
            email: $('#email').val(),
            password: $('#formGroupPASSInput').val()
        },
        success: function () {
            $('#error-group').css('display', 'none')
            alert('Your submission was successful')
        },
        error: function (data) {
            $('#error-group').css('display', 'block')
            var errors = JSON.parse(data.responseText)
            var errorsContainer = $('#errors')
            errorsContainer.innerHTML = ''
            var errorsList = ''

            for (var i = 0; i < errors.length; i++) {
                errorsList += '<li>' + errors[i].msg + '</li>'
            }

            errorsContainer.html(errorsList)
        }
    })
})

function getLogin() {
    let page = location.href = '/login'
    document.getElementById('btn_login').onclick = page
}

