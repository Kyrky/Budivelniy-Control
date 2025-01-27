function handleSubmit(event) {
    event.preventDefault(); 


    const email = document.getElementById('email').value;
    const service = document.getElementById('serviceSearch').value;
    const message = document.getElementById('message').value;


    const subject = encodeURIComponent('Заявка на послугу');
    const body = encodeURIComponent(`
        Ваша електронна пошта: ${email}
        Послуга: ${service}
        Додаткові коментарі: ${message}
    `);

  
    const mailtoLink = `mailto:b-k2012@ukr.net?subject=${subject}&body=${body}`;


    window.location.href = mailtoLink;
}
