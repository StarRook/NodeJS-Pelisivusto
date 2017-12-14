'use strict';
$(()=>{
  console.log("luetaan tämä");
  const passChange = document.querySelector("#change");
  const message = document.querySelector("#message");
  const oldPass = document.querySelector("#old");
  const newPass = document.querySelector("#new");
  /*
  const picChange = document.querySelector("#picture");
  const file = document.querySelector("#fileInput");
  const profile=  document.querySelector("#profilePic");
  */

  passChange.addEventListener("submit",(ev)=>{
    console.log("nyt painettiin subumit");
    ev.preventDefault();
    $.ajax({
      url: "/newpassword",
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        oldpassword: oldPass.value,
        newpassword: newPass.value }),
      success: (response)=>{
        for(let i in response){
          console.log("response" + i);
        }
        console.log("successs "+response);
        message.innerHTML = response;

      }
    })
  });



/* Kuvien vaihto ajaxil meni vähä liian hankalaks
  picChange.addEventListener("submit",(ev)=>{
    console.log("nyt lähetetään kuva:d");
    ev.preventDefault();
    const data = new FormData();
    data.append("file" ,file.files[0]);
    $.ajax({
      url: "/upload",
      method: "POST",
      //contentType: "multipart/form-data",
      data: data,
      cache: false,
      contentType: false,
      processData: false,
      success: (response)=>{
        if(response.onnistuminen){
        console.log(response.message + " "+ response.file);
        profile.src=response.file;
        }
        message.innerHTML=response.message;

      }
    })
  });
*/


});