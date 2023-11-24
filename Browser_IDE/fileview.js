"use strict";

function nodeExists(path)
{
    try{FS.lookupPath(path, { follow: false }).node; return true;}
    catch(e) {return false;}
}


let isDragPotential = false;
let mouseStart = [0,0];
let dragOffset = [0,0];
let draggedNode = null;
let draggedClone = null;
let isDragging = false;
let dragDist = 4*4;
let currentTarget = null;
let insertionPoint = document.createElement("div");
insertionPoint.classList.add("insertion-point-display");

for (let node of document.getElementsByClassName("directory"))
{
    node.addEventListener("click", async function (e) {
        //alert("clicked" + node.text);
        let isOpen = node.children[1].classList.contains("open-directory");
        let newState = !isOpen;
        if (newState == false)
        {
            node.children[1].classList.remove("open-directory");
            node.children[1].classList.add("closed-directory");
            node.children[1].style.maxHeight = node.children[1].scrollHeight+"px";
            window.getComputedStyle(node.children[1]).maxHeight;
            node.children[1].style.maxHeight = "0px";
            node.children[0].classList.remove("bi-folder2-open");
            node.children[0].classList.add("bi-folder2");
        }
        else
        {
            node.children[1].classList.add("open-directory");
            node.children[1].classList.remove("closed-directory");
            node.children[1].style.maxHeight = node.children[1].scrollHeight+"px";
            node.children[0].classList.add("bi-folder2-open");
            node.children[0].classList.remove("bi-folder2");
            setTimeout(function(){
                isOpen = node.children[1].classList.contains("open-directory");
                if (isOpen)
                    node.children[1].style.maxHeight = 'initial';
            }, 320);
        }
        e.stopPropagation();
    });
}
for (let node of document.getElementsByClassName("file"))
{
    node.addEventListener("click", async function (e) {
        e.stopPropagation();
    });
}
for (let node of document.getElementsByClassName("node"))
{
    node.addEventListener("mousedown", async function (e) {
        e.stopPropagation();
        e.preventDefault();
        isDragPotential = true;
        mouseStart[0] = e.clientX;// + node.offsetLeft;
        mouseStart[1] = e.clientY;// + node.offsetTop;
        let offsets = node.getBoundingClientRect();
        dragOffset[0] = offsets.left;//node.offsetLeft;
        dragOffset[1] = offsets.top;//node.offsetTop;
        draggedNode = node;
    });
}

// How does this work??
// function 'contains' from Aleksandr Makov - https://stackoverflow.com/a/47485168
function contains(parent, child) {
  return parent !== child && parent.contains(child);
}

function dropElementInNodeTree(cx,cy,elem)
{
    for(let under of document.elementsFromPoint(cx, cy))
    {
        if (under.classList.contains("node") && !contains(draggedNode, under) && !contains(draggedClone, under) && draggedClone != under)
        {
            let isDir = under.classList.contains("directory");
            let label = under;
            if (isDir)
                label = under.children[0];
            let offsets = label.getBoundingClientRect();
            let midpoint = offsets.top + offsets.height/2;
            if (cy < midpoint || draggedNode == under)
            {
                under.parentElement.insertBefore(elem, under);
            }
            else
            {
                if (isDir)
                    under.children[1].insertBefore(elem, under.children[1].children[0]);
                else
                    under.insertAdjacentElement("afterend", elem);
            }

            console.log(cy < midpoint);

            break;
        }
    }
}
document.addEventListener("mousemove", function(e) {
    if (isDragPotential || isDragging)
    {
        let cx = e.clientX;
        let mx = mouseStart[0];//-dragOffset[0];
        let cy = e.clientY;
        let my = mouseStart[1];//-dragOffset[1];
        if (!isDragging && (cx-mx)*(cx-mx) + (cy-my)*(cy-my) > dragDist)
        {
            isDragging = true;
            //draggedNode.style.position = 'relative';
            draggedClone = draggedNode.cloneNode(true);
            document.body.appendChild(draggedClone);
            draggedClone.classList.add('in-drag');
        }
        if (isDragging)
        {
            //console.log("dragging"+(draggedNode.offsetLeft - parseInt(draggedNode.style.left, 10)));
            draggedClone.style.left = (cx-mx+dragOffset[0])+"px";//+dragOffset[0]
            draggedClone.style.top = (cy-my+dragOffset[1])+"px";//+dragOffset[1]

            dropElementInNodeTree(cx, cy, insertionPoint);
        }

    }
});

document.addEventListener("mouseup", function(e) {
    if (isDragging)
    {
        let cx = e.clientX;
        let cy = e.clientY;
        dropElementInNodeTree(cx, cy, draggedNode);
        insertionPoint.remove();
        draggedClone.remove();
        draggedClone = null;
    }
    isDragPotential = false;
    isDragging = false;
});