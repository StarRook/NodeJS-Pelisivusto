const modal = document.querySelector('#changePictureModal');
const changePictureButton = document.querySelector('#changePictureButton');
const closeSpan1 = document.querySelector('#closeSpan1'); 

const modal2 = document.querySelector('#changePasswordModal');
const changePasswordButton = document.querySelector('#changePasswordButton');
const closeSpan2 = document.querySelector('#closeSpan2');

changePictureButton.addEventListener('click', ()=>{
    modal.style.display = 'block';
});

closeSpan1.addEventListener('click', ()=>{
    modal.style.display = 'none';
});

changePasswordButton.addEventListener('click', ()=>{
    modal2.style.display = 'block';
});

closeSpan2.addEventListener('click', ()=>{
    modal2.style.display = 'none';
});

window.onclick = (event) =>{
    if(event.target == modal || event.target == modal2){
        modal.style.display = "none";
        modal2.style.display = "none";
    }
}