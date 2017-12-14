const onJoTili = document.querySelector('#onJoTili');
const eiTilia = document.querySelector('#eiTilia');
const loginDiv = document.querySelector('#loginsection');
const registerDiv = document.querySelector('#registersection');


onJoTili.addEventListener('click', ()=>{
	registerDiv.classList.add('hidden');
	loginDiv.classList.remove('hidden');
})

eiTilia.addEventListener('click', ()=>{
	loginDiv.classList.add('hidden');
	registerDiv.classList.remove('hidden');
})