$(()=> {
  'use strict';
  const makeFriends = document.querySelector("#friends");
  const friend = document.querySelectorAll(".frow");
  const list = [];
  const users = document.querySelectorAll(".user");
  //const mainUser = document.querySelector("#id").innerHTML;
//userID ja usersData
  console.log("henkilöitä on " + usersData.length);
  // kun sivu ladannut lataa kaverit

  const change=(num)=>{
      document.querySelector("#friends").innerHTML=`<p> moi ${num}</p>`;
  };


  if (usersData) {
    let i =0;
      for (let user of usersData) {
          console.log("mennään");
          $.ajax({
              url: "/isfriend",
              method: 'POST',
              contentType: 'application/json',
              data: JSON.stringify({
                  id1: userID,
                  id2: user
              }),
              success: (response) => {
                  if(userID===user){
                      friend[i].innerHTML =`<p>Tämä olet sinä itse:-)`;
                  }else{
                  if (response) {
                      friend[i].innerHTML = `<button id="button${i}" type="button" class="userButt">Poista ystävä:-(</button>`;
                      document.querySelector(`#button${i}`).addEventListener("click",()=>{
                          $.ajax({
                              url: "/removefriend",
                              method: 'POST',
                              contentType: 'application/json',
                              data: JSON.stringify({
                                  id1: user,
                                  id2: userID
                              }),
                              success: (response) => {
                                  if (response) {
                                      console.log("poistettu");
                                  } else {
                                      console.log("ei onnistunut");
                                  }
                              }
                          })

                      });
                  } else {
                      friend[i].innerHTML = `<button id="button${i}" type="button" class="userButt">Lisää ystäväksi:-)</button>`;
                      document.querySelector(`#button${i}`).addEventListener("click",()=>{
                          $.ajax({
                              url: "/makefriend",
                              method: 'POST',
                              contentType: 'application/json',
                              data: JSON.stringify({
                                  id1: user,
                                  id2: userID
                              }),
                              success: (response) => {
                                  if (response) {
                                    console.log(i + " mikä on i ");
                                    change(i);
                                      //this.innerHTML = `<p>Lisättyy!</p>`;
                                  } else {
                                      console.log(i + " mikä on i ");
                                      //this.innerHTML = `<p>Ei onnistunut!</p>`;
                                  }
                              }
                          })
                      });
                  }
                  }
                  i++;
              }
          })
      }
      /*
      const friendMaker = document.querySelector(".userButt");
      for (let maker of friendMaker) {
          friendMaker.addEventListener("click", () => {
              console.log("nappia painettu");
              console.log(this.name);

              $.ajax({
                  url: "/makefriend",
                  method: 'POST',
                  contentType: 'application/json',
                  data: JSON.stringify({
                      id1: user,
                      id2: userID[maker]
                  }),
                  success: (response) => {
                      if (response) {
                          friend[maker].innerHTML = `<p>Lisättyy!</p>`;
                      } else {
                          friend[maker].innerHTML = `<p>Ei onnistunut!</p>`;
                      }
                  }
              })
          })
      }*/
  }

});