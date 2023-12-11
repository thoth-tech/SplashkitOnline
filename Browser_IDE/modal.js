"use strict";

// Thin wrapper around Bootstrap, in case we stop using it later
function createModal(name, title, content, primaryButton, secondaryButton = null){

    let modal = document.createElement("div");

    // Create via string template...
    let modalString = [
    '<div id="'+name+'" tabindex="-1" class="modal fade" aria-hidden="true" aria-labelledby="exampleModalLabel">',
    '  <div class="modal-dialog">',
    '    <div class="modal-content bg-dark text-bg-dark">',
    '      <div class="modal-header">',
    '        <h5 class="modal-title">'+title+'</h5>',
    '        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>',
    '      </div>',
    '      <div class="modal-body">',
    '        '+content+'',
    '      </div>',
    '      <div class="modal-footer">',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>'].join("\n");

    modal.innerHTML = modalString;

    if (secondaryButton != null){
        var sButton = document.createElement("button");
        sButton.classList.add("btn","btn-secondary");
        sButton.innerText = secondaryButton.label;
        sButton.onclick = secondaryButton.callback;
        modal.getElementsByClassName("modal-footer")[0].appendChild(sButton);
    }
    if (primaryButton != null){
        var pButton = document.createElement("button");
        pButton.classList.add("btn","btn-success");
        pButton.innerText = primaryButton.label;
        pButton.onclick = primaryButton.callback;
        modal.getElementsByClassName("modal-footer")[0].appendChild(pButton);
    }

    document.body.appendChild(modal);

    return new bootstrap.Modal(modal.childNodes[0], {});
}
