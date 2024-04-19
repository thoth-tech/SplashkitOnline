function createModal(name, title, content, primaryButton, secondaryButton = null) {
    const modalHTML = `
        <div id="${name}" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="${name}Label" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${name}Label">${title}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">${content}</div>
                    <div class="modal-footer">
                        ${secondaryButton ? `<button type="button" class="btn btn-secondary">${secondaryButton.label}</button>` : ""}
                        <button type="button" class="btn btn-primary">${primaryButton.label}</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.innerHTML += modalHTML;
    let modalElement = document.getElementById(name);
    return new bootstrap.Modal(modalElement);
}
