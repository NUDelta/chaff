function changeColor1() {
  var newColor = '#'+Math.floor(Math.random()*16777215).toString(16);
  // console.log(newColor);
  $("#button1").css("background-color", newColor);
}

function changeColor2() {
  var newColor = '#'+Math.floor(Math.random()*16777215).toString(16);
  // console.log(newColor);
  $("#button2").css("background-color", newColor);
}

$(document).ready(function() {
  $("#button1").click(function() {
    changeColor1();
  });
  $("#button2").click(function() {
    changeColor2();
  });

  // $("#disable1").click(function() {
  //   changeColor1 = null;
  // });
  // $("#disable2").click(function() {
  //   changeColor2 = null;
  // });

});
