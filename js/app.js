var graph_button = document.getElementById('graph_button');
var equation = document.getElementById('equation');
var x = document.getElementById('x');
var y = document.getElementById('y');
var step_size = document.getElementById('step_size');

function valid_input() {
    if(equation.value === null || equation.value.trim() === "")
        return false;
    
    if(x.value === null || x.value === "" || isNaN(x.value))
        return false;
    
    if(y.value === null || y.value === "" || isNaN(y.value))
        return false;
    
    if(step_size.value === null || step_size.value === "" || isNaN(step_size.value))
        return false;
    
    // add equation checking here, e.g. check if its a valid equation
    
    return true;
}

function graph() {
    if(valid_input()) {
        // graphing stuff
    }
    else {
        alert('Invalid Input!');
    }
}

graph_button.onclick = graph;