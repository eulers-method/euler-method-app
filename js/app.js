/*global math*/
/*global MathJax*/
/*global $*/
var graph_button = document.getElementById('graph_button');
var equation_elem = document.getElementById('equation');
var x_elem = document.getElementById('x');
var y_elem = document.getElementById('y');
var step_size_elem = document.getElementById('step_size');
var iterations_elem = document.getElementById('iterations');
var canvas_elem = document.getElementById('canvas');
var step_size_2_elem = document.getElementById('step_size2');
canvas_elem.style.cursor = 'default'; // Don't change to text selection cursor
var canvas = canvas_elem.getContext('2d');
var iterations, step_size, points, scope, points2, step_size2 = null, iterations2;
var start = {x: -1, y: -1}, scale = 50; // Grid bottom-left corner relative to graph points
var w, h; // width and height of canvas element
var prevmouse; // Previous mouse location
var panning = false;
var mouse_pos; // mouse position
var zoomscale = 1.2;
var tooltip = document.getElementsByClassName('point_tooltip')[0];
var point_mode_elem = document.getElementById('point_mode');
var point_mode = false;

var min_x = 0, max_x = 0, min_x2 = 0, max_x2 = 0;
var hover_x = NaN, hover_y = NaN;
var draw_dot = false;
var DOT_HOVER = 900;

// point object constructor
function point(x, y) {
    this.x = x;
    this.y = y;
}

var node = null, func = null;
var ROUND = 6;

canvas_elem.height = window.innerHeight - 190;
console.log(window.innerHeight);
canvas.translate(0.69, 0.420);

function valid_input() {
    if(equation_elem.value === null || equation_elem.value.trim() === '')
        return 'invalid equation';
    
    if(x_elem.value === null || x_elem.value === '' || math.isNaN(x_elem.value))
        return 'invalid x value';
    
    if(y_elem.value === null || y_elem.value === '' || math.isNaN(y_elem.value))
        return 'invalid y value';
    
    if(step_size_elem.value === null || step_size_elem.value === '' || math.isNaN(step_size_elem.value))
        return 'invalid step size';
    
    if(iterations_elem.value === null || iterations_elem.value === '' || math.isNaN(iterations_elem.value) || !math.isInteger(iterations_elem.value))
        return 'invalid iteration value';
    
    step_size2 = null;
    
    if(step_size_2_elem.value !== null && step_size_2_elem.value !== '') {
        if(math.isNaN(step_size_2_elem.value) || parseFloat(step_size_2_elem.value) === 0)
            return 'invalid second step size';
        step_size2 = parseFloat(step_size_2_elem.value);
    }
    
    node = math.parse(equation_elem.value);
    func = node.compile();
    
    var scope = {
        x: x_elem.value,
        y: y_elem.value
    };
    
    try {
        console.log(func.eval(scope));
    }
    catch(err) {
        return err.message;
    }
    
    return 'valid';
}

function graph() {
    var status = valid_input();

    if(status === 'valid') {
        console.log('valid input');
        $('#point_table tbody > tr').remove();
        $('#point_table2 tbody > tr').remove();
        $('#step_size2_panel').removeAttr('data-toggle');
        $('#step_size2_panel').removeClass('waves-effect');
        $('#points_tab a:first').tab('show');
        // graphing stuff
        iterations = parseInt(iterations_elem.value, 10);
        step_size = parseFloat(step_size_elem.value);
        
        points = Array(iterations * 2 + 1);
        scope = null;
        
        // do (iterations) iterations to the left of initial point, and (iterations) iterations to the right of initial point
        
        points[iterations] = new point(parseInt(x_elem.value, 10), parseInt(y_elem.value, 10));
        min_x = max_x = iterations;
        
        // left side
        for (var n = iterations - 1; n >= 0; n--) {
            scope = {
                x: points[n + 1].x,
                y: points[n + 1].y
            };
            
            points[n] = new point(points[n + 1].x - step_size, points[n + 1].y - step_size * func.eval(scope));
            
            // deals with coordinates being NaN or +-INFINITY
            if(isFinite(points[n].x))
               points[n].x = math.round(points[n].x, ROUND);
               
            if(isFinite(points[n].y))
                points[n].y = math.round(points[n].y, ROUND);
                
            if (isFinite(points[n].x) && isFinite(points[n].y)) {
               min_x = points[min_x].x > points[n].x ? n : min_x;
               max_x = points[max_x].x < points[n].x ? n : max_x;
            }
        }
        
        // right side
        for(var n = iterations + 1; n < points.length; n++) {
            scope = {
                x: points[n - 1].x,
                y: points[n - 1].y
            };
            
            points[n] = new point(points[n - 1].x + step_size, points[n - 1].y + step_size * func.eval(scope));
            
            // deals with coordinates being NaN or +-INFINITY
            if(isFinite(points[n].x))
               points[n].x = math.round(points[n].x, ROUND);
               
            if(isFinite(points[n].y))
                points[n].y = math.round(points[n].y, ROUND);
                
            if (isFinite(points[n].x) && isFinite(points[n].y)) {
               min_x = points[min_x].x > points[n].x ? n : min_x;
               max_x = points[max_x].x < points[n].x ? n : max_x;
            }
        }
        
        console.log("x: " + min_x + " " + points[min_x].x + " " + points[min_x].y + " " + max_x + " " + points[max_x].x + " " + points[max_x].y);
        
        /*for(var n = 0; n < points.length; ++n) {
            console.log(points[n].x + " " + points[n].y);
        }*/
        
        for (var n = 0; n < points.length; ++n) {
            $('#point_table tbody').append('<tr class="child"><td>' + points[n].x + '</td><td>' + points[n].y + '</td></tr>');
        }
        
        $('#activate_points').attr('disabled', false);
        
        scale = 50;
        start = new point(-1, -1);
        
        point_mode_elem.removeAttribute('disabled');
        document.getElementById('latex').innerHTML = '$$\\frac{dy}{dx} = ' + node.toTex() + '$$';
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, document.getElementById('latex')]);
        
        // second step size code
        if(step_size2 != null) {
            iterations2 = math.ceil(iterations * step_size / step_size2);
            points2 = Array(iterations2 * 2 + 1);
            points2[iterations2] = new point(parseInt(x_elem.value, 10), parseInt(y_elem.value, 10));
            
            min_x2 = max_x2 = iterations2;
            
            // left side
            for (var n = iterations2 - 1; n >= 0; n--) {
                scope = {
                    x: points2[n + 1].x,
                    y: points2[n + 1].y
                };
                
                points2[n] = new point(points2[n + 1].x - step_size2, points2[n + 1].y - step_size2 * func.eval(scope));
                
                // deals with coordinates being NaN or +-INFINITY
                if(isFinite(points2[n].x))
                   points2[n].x = math.round(points2[n].x, ROUND);
                
                if(isFinite(points2[n].y))
                    points2[n].y = math.round(points2[n].y, ROUND);
                
                if (isFinite(points2[n].x) && isFinite(points2[n].y)) {
                   min_x2 = points2[min_x2].x > points2[n].x ? n : min_x2;
                   max_x2 = points2[max_x2].x < points2[n].x ? n : max_x2;
                }
            }
            
            // right side
            for(var n = iterations2 + 1; n < points2.length; n++) {
                scope = {
                    x: points2[n - 1].x,
                    y: points2[n - 1].y
                };
                
                points2[n] = new point(points2[n - 1].x + step_size2, points2[n - 1].y + step_size2 * func.eval(scope));
                
                // deals with coordinates being NaN or +-INFINITY
                if(isFinite(points2[n].x))
                   points2[n].x = math.round(points2[n].x, ROUND);
                   
                if(isFinite(points2[n].y))
                    points2[n].y = math.round(points2[n].y, ROUND);
                    
                if (isFinite(points2[n].x) && isFinite(points2[n].y)) {
                   min_x2 = points2[min_x2].x > points2[n].x ? n : min_x2;
                   max_x2 = points2[max_x2].x < points2[n].x ? n : max_x2;
                }
            }
            
            $('#step_size2_panel').addClass('waves-effect');
            $('#step_size2_panel').attr('data-toggle', 'tab');
             for (var n = 0; n < points2.length; ++n) {
                $('#point_table2 tbody').append('<tr class="child"><td>' + points2[n].x + '</td><td>' + points2[n].y + '</td></tr>');
            }
        }
        
        resizeCanvas();
    }
    else {
        alert(status);
    }
}

function distortx(x) {
    return (x - start.x) * scale;
}

function undistortx(x) {
    return x / scale + start.x;
}

function distorty(y) {
    return h - (y - start.y) * scale;
}

function undistorty(y) {
    return (h - y) / scale + start.y;
}

function drawGrid() {
    console.log('Starting drawing grid');
    var occ = 1.;
    if(Math.abs(Math.pow(10, Math.ceil(Math.log10(50 / scale))) - 50 / scale) < Math.abs(Math.pow(10, Math.ceil(Math.log10(50 / scale))) / 2 - 50 / scale))
        occ = Math.pow(10, Math.ceil(Math.log10(50 / scale)));
    else
        occ = Math.pow(10, Math.ceil(Math.log10(50 / scale))) / 2;
        
    occ = math.round(occ, 6);
    console.log('occ: ' + occ);
    
    canvas.clearRect(0, 0, w, h);
    canvas.lineWidth = 1;
    canvas.strokeStyle = '#dddddd';
    canvas.beginPath();
    canvas.textAlign = 'center';
    canvas.fillStyle = '#7a7a7a';
    
    //apparently this needs to be done http://stackoverflow.com/questions/18092753/change-font-size-of-canvas-without-knowing-font-family
    var args = canvas.font.split(' ');
    canvas.font = '14px' + ' ' + args[args.length - 1];
    
    // Horizontal lines
    for(var y = Math.ceil(start.y / occ); y <= Math.ceil((start.y + h / scale) / occ); y++) {
        canvas.fillText(math.round(y * occ, 2), 15, distorty(y * occ) - 10);
        canvas.moveTo(0, distorty(y * occ));
        canvas.lineTo(w, distorty(y * occ));
    }
    
    // Vertical lines
    for(var x = Math.ceil(start.x / occ); x <= Math.ceil((start.x + w / scale) / occ); x++) {
        canvas.fillText(math.round(x * occ, 2), distortx(x * occ) + 10, h - 15);
        canvas.moveTo(distortx(x * occ), 0);
        canvas.lineTo(distortx(x * occ), h);
    }
    
    // Drawing coordinate axes
    canvas.stroke();
    canvas.beginPath();
    canvas.lineWidth = 2;
    canvas.strokeStyle = '#4d4d4d';
    if(distorty(0) >= 0 && distorty(0) <= h) {
        canvas.moveTo(0, distorty(0));
        canvas.lineTo(w, distorty(0));
    }
    if(distortx(0) >= 0 && distortx(0) <= w) {
        canvas.moveTo(distortx(0), 0);
        canvas.lineTo(distortx(0), h);
    }
    canvas.stroke();
    console.log('Done drawing grid!');
}

function realDrawGraph(pts, col) {
    canvas.lineWidth = 5;
    canvas.strokeStyle = col;
    
    //console.log('------');
    
    canvas.beginPath();
    var i = 0;
    for(i = 0; i < pts.length; i++)
        if(isFinite(pts[i].y))
            break;
    console.log(i);
    if(i != pts.length) {
        canvas.moveTo(distortx(pts[i].x), distorty(pts[i].y));
        // atharvas cool way of graphing :)
        for(var n = i + 1; n < pts.length; n++, xx++) {
            canvas.lineTo(distortx(pts[n].x), distorty(pts[n].y));
            canvas.stroke(); canvas.beginPath(); canvas.moveTo(distortx(pts[n].x), distorty(pts[n].y));
        }
        
        // justins bad way of graphing :(
        canvas.beginPath(); canvas.moveTo(distortx(pts[i].x), distorty(pts[i].y));
        
        var last_one = -1; // 0 = normal, 1 = inf, 2 = -inf
        var xx = i + 1;
        for(var n = i + 1; n < pts.length; n++, xx++) {
            if(math.isNaN(pts[n].y))
                break;
            
            if(pts[n].y > math.pow(10, 10) && distorty(pts[n].y) <= 0) {
                if(last_one == 1)
                    break;
                
                canvas.lineTo(distortx(pts[n].x), 0);
                last_one = 1;
            }
            else if(pts[n].y < -math.pow(10, 10) && distorty(pts[n].y) >= canvas.height) {
                if(last_one == 2)
                    break;
                
                canvas.lineTo(distortx(pts[n].x), canvas.height);
                last_one = 2;
            }
            else {
               canvas.lineTo(distortx(pts[n].x), distorty(pts[n].y));
               last_one = 0;
            }
        }
        //console.log('stroke at ' + xx + ' ' + points[xx].x + ' ' + last_one)
        canvas.stroke();
    }
    return i;
}

function drawGraph() {
    //console.log(canvas.width + ', ' + canvas.height);
    console.log('Starting drawing graph');
    drawGrid();
    
    var i = 0, i2 = 0;
    
    if(step_size2 != null)
       i2 = realDrawGraph(points2, '#29cc96');
    
    i = realDrawGraph(points, '#2994cc');
    
    console.log('Done drawing graph!');
    
    if(point_mode) {
        if(step_size2 != null)
            draw_pt_mode(points2, '#1f9970', i2);
        draw_pt_mode(points, '#1f6f99', i);
        console.log('done drawing pts');
    }
    
    var radius = 5;
    
    // draw current hover point + line
    if(!math.isNaN(hover_x) && !math.isNaN(hover_y) && draw_dot) {
        console.log('Starting drawing hover point');
        canvas.beginPath();
        canvas.moveTo(distortx(hover_x), 0);
        canvas.strokeStyle = '#F8BBD0';
        canvas.lineWidth = 3;
        canvas.lineTo(distortx(hover_x) + 0.5, h);
        canvas.stroke();
        
        canvas.beginPath();
        canvas.arc(distortx(hover_x), distorty(hover_y), radius, 0, 2 * Math.PI, false);
        canvas.fillStyle = '#F8BBD0';
        canvas.fill();
        canvas.strokeStyle = '#F48FB1';
        canvas.stroke();
        console.log('Done drawing hover point!');
    }
}

function draw_pt_mode(pts, col, i) {
    canvas.fillStyle = col;
    
    var radius = 5;
    
    
    for(var n = i; n < pts.length; n++) {
        if(distortx(pts[n].x) >= 0 && distortx(pts[n].x) <= w && distorty(pts[n].y) >= 0 && distorty(pts[n].y) <= h) {
            console.log(pts[n].x + ', ' + pts[n].y);
            canvas.beginPath();
            canvas.arc(distortx(pts[n].x), distorty(pts[n].y), radius, 0, 2 * Math.PI, true);
            canvas.fill();
        }
    }
}

function toggle_point_mode(checkbox) {
    if(checkbox.checked) {
        console.log('Point mode enabled');
        point_mode = true;
    } else {
        console.log('Point mode disabled');
        point_mode = false;
    }
    if(valid_input() === 'valid')
            drawGraph();
        else
            drawGrid();
}

graph_button.onclick = graph;

// init canvas resizing
window.addEventListener('resize', resizeCanvas, false);
resizeCanvas();

function resizeCanvas() {
    w = canvas_elem.width = canvas.width = canvas_elem.scrollWidth;
    h = canvas_elem.height = canvas.height = canvas_elem.scrollHeight = window.innerHeight - document.getElementById('latex').scrollHeight - document.getElementById('toolbar').scrollHeight - 35;
    
    canvas.translate(0.69, 0.420);
    
    if(valid_input() === 'valid')
        drawGraph();
    else
        drawGrid();
}

function get_mouse_pos(c, evt) {
    var rect = c.getBoundingClientRect();
    return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};
}

function get_neighbour_pts(x) {
    var left = x_elem.value - math.floor(iterations) * step_size;
    var right = x_elem.value + math.floor(iterations) * step_size;
    
    var left_pt_index = math.floor((x - left) / step_size);
    var right_pt_index = math.ceil((x - left) / step_size);
    
    if(isFinite(left_pt_index) && isFinite(right_pt_index) && 0 <= left_pt_index && left_pt_index < points.length && 0 <= right_pt_index && right_pt_index < points.length && left <= x && x <= right)
        return new point (left_pt_index, right_pt_index);
    
    return new point(-1, -1);
}

canvas_elem.addEventListener('touchstart', function(evt) {
    var touch = evt.changedTouches[0]; // first finger to touch screen
    prevmouse = {x: parseInt(touch.clientX), y: parseInt(touch.clientY)};
    evt.preventDefault();
}, false);

canvas_elem.addEventListener('touchmove', function(evt) {
    // panning
    if(evt.targetTouches.length == 1) {
        var touch = evt.targetTouches[0];
        mouse_pos = {x: parseInt(touch.clientX), y: parseInt(touch.clientY)};
        
        // Place element where the finger is
        start.x += -(mouse_pos.x - prevmouse.x) / scale;
        start.y += (mouse_pos.y - prevmouse.y) / scale;
        prevmouse = mouse_pos;
        
        evt.preventDefault();
        if(valid_input() === 'valid')
            drawGraph();
        else
            drawGrid();
    }
}, false);

canvas_elem.addEventListener('mousedown', function(evt) {
    console.log('Starting panning');
    panning = true;
    prevmouse = get_mouse_pos(canvas_elem, evt);
});

canvas_elem.addEventListener('mousemove', function(evt) {
    // console.log(math.isNaN(1 / 0));
    $(tooltip).removeClass('active');
    mouse_pos = get_mouse_pos(canvas_elem, evt);
    evt.preventDefault();
    
    if(panning) {
        console.log('Panned!');
        start.x += -(mouse_pos.x - prevmouse.x) / scale;
        start.y += (mouse_pos.y - prevmouse.y) / scale;
        prevmouse = mouse_pos;
        
        if(valid_input() === 'valid')
            drawGraph();
        else
            drawGrid();
        console.log('Done panning');
        
    } else if(valid_input() === 'valid') {
        var pos = get_neighbour_pts(undistortx(mouse_pos.x));
        
        console.log('pos: ' + pos.x + ', ' + pos.y)
        
        if(pos.x != -1) { // mouse is between two points
            console.log(pos.x + " " + pos.y + "between points " + points[pos.x].x + " " + points[pos.x].y + " and " + points[pos.y].x + " " + points[pos.y].y);
            
            if(isFinite(points[pos.x].x) && isFinite(points[pos.x].y) && isFinite(points[pos.y].x) && isFinite(points[pos.y].y)) { // need to check because some points are NaN
                if(pos.x === pos.y) { // mouse is directly on point
                    hover_x = math.round(points[pos.x].x, 2);
                    hover_y = math.round(points[pos.x].y, 2);
                    draw_dot = math.pow(distortx(hover_x) - mouse_pos.x, 2) + math.pow(distorty(hover_y) - mouse_pos.y, 2)  <= DOT_HOVER;
                    tooltip.innerHTML = '(' + hover_x + ', ' + hover_y + ')';
                }
                else {
                    // find intersection of line formed by two points and x = mouse_pos
                    var slope = (points[pos.x].y - points[pos.y].y) / (points[pos.x].x - points[pos.y].x);
                    hover_x = math.round(undistortx(mouse_pos.x), 2);
                    hover_y = math.round((slope * undistortx(mouse_pos.x) + points[pos.x].y - slope * points[pos.x].x), 2);
                    draw_dot = math.pow(distortx(hover_x) - mouse_pos.x, 2) + math.pow(distorty(hover_y) - mouse_pos.y, 2)  <= DOT_HOVER;
                    tooltip.innerHTML = '(' + hover_x + ', ' + hover_y + ')';
                }   
            }
            else if(isFinite(points[min_x].x) && isFinite(points[min_x].y) && isFinite(points[max_x].x) && isFinite(points[max_x].y)) {
                console.log('finite');
                if (undistortx(mouse_pos.x) < points[min_x].x) {
                    hover_x = math.round(points[min_x].x, 2);
                    hover_y = math.round(points[min_x].y, 2);
                    draw_dot = math.pow(distortx(hover_x) - mouse_pos.x, 2) + math.pow(distorty(hover_y) - mouse_pos.y, 2)  <= DOT_HOVER;
                    tooltip.innerHTML = '(' + hover_x + ', ' + hover_y + ')';
                }
                else if (undistortx(mouse_pos.x) > points[max_x].x) {
                    hover_x = math.round(points[max_x].x, 2);
                    hover_y = math.round(points[max_x].y, 2);
                    draw_dot = math.pow(distortx(hover_x) - mouse_pos.x, 2) + math.pow(distorty(hover_y) - mouse_pos.y, 2)  <= DOT_HOVER;
                    tooltip.innerHTML = '(' + hover_x + ', ' + hover_y + ')';
                }
                else {
                    hover_x = NaN; hover_y = NaN;
                }
            }
        }
        else if(isFinite(points[min_x].x) && isFinite(points[min_x].y) && isFinite(points[max_x].x) && isFinite(points[max_x].y)) {
            console.log('finite');
            if (undistortx(mouse_pos.x) < points[min_x].x) {
                hover_x = math.round(points[min_x].x, 2);
                hover_y = math.round(points[min_x].y, 2);
                draw_dot = math.pow(distortx(hover_x) - mouse_pos.x, 2) + math.pow(distorty(hover_y) - mouse_pos.y, 2)  <= DOT_HOVER;
            }
            else if (undistortx(mouse_pos.x) > points[max_x].x) {
                hover_x = math.round(points[max_x].x, 2);
                hover_y = math.round(points[max_x].y, 2);
                draw_dot = math.pow(distortx(hover_x) - mouse_pos.x, 2) + math.pow(distorty(hover_y) - mouse_pos.y, 2)  <= DOT_HOVER;
            }
            else {
                hover_x = NaN; hover_y = NaN;
            }
        }
        else {
            hover_x = NaN; hover_y = NaN;
        }
        if(draw_dot) {
            tooltip.innerHTML = '(' + hover_x + ', ' + hover_y + ')';
            $(tooltip).addClass('active');
            tooltip.style.left = evt.pageX + 'px';
            tooltip.style.top = evt.pageY + 'px';
            console.log(evt.pageX + ', ' + evt.pageY);
        }
        drawGraph();
    }
  }, false);

canvas_elem.addEventListener('mouseup', function(evt) {
    console.log('Done panning!');
    panning = false;
});

canvas_elem.addEventListener('mouseout', function(evt) {
    $(tooltip).removeClass('active');
    if(panning) {
        console.log('Done panning!');
        panning = false;
    }
});

canvas_elem.addEventListener('wheel', function(evt) {
    console.log('Starting zoom');
    evt.preventDefault();
    mouse_pos = get_mouse_pos(canvas_elem, evt);
    if(evt.wheelDelta < 0) { // Zoom out
        console.log('Zoom out');
        scale /= zoomscale;
        start.x -= (undistortx(mouse_pos.x) - start.x) * (zoomscale - 1);
        start.y -= (undistorty(mouse_pos.y) - start.y) * (zoomscale - 1);
    }
    else { // Zoom in
        console.log('Zoom in');
        scale *= zoomscale;
        start.x += (undistortx(mouse_pos.x) - start.x) * (1 - 1 / zoomscale);
        start.y += (undistorty(mouse_pos.y) - start.y) * (1 - 1 / zoomscale);
    }
    //scale = Math.round(scale, 6);
    
    if(valid_input() === 'valid')
        drawGraph();
    else
        drawGrid();
    console.log('Done zooming');
});

document.getElementById('zoom-in').onclick = function() {
    console.log('Zoom in');
    scale *= zoomscale;
    start.x += (undistortx(w/2) - start.x) * (1 - 1 / zoomscale);
    start.y += (undistorty(h/2) - start.y) * (1 - 1 / zoomscale);
    if(valid_input() === 'valid')
        drawGraph();
    else
        drawGrid();
    console.log('Done zooming');
}

document.getElementById('zoom-out').onclick = function() {
    console.log('Zoom out');
    scale /= zoomscale;
    start.x -= (undistortx(w/2) - start.x) * (zoomscale - 1);
    start.y -= (undistorty(h/2) - start.y) * (zoomscale - 1);
    if(valid_input() === 'valid')
        drawGraph();
    else
        drawGrid();
    console.log('Done zooming');
}

$('#modal').modal('show'); // Opens the modal at the beginning

$('#experimental').on('show.bs.collapse', function() {
    $('#experimental_button').addClass('active');
});

$('#experimental').on('hide.bs.collapse', function() {
    $('#experimental_button').removeClass('active');
});

$('#step_size2_panel').removeAttr('data-toggle');
$('#step_size2_panel').removeClass('waves-effect');