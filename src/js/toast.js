// Toast notification utility
const Toast = {
    el: null,
    timeout: null,

    init() {
        this.el = document.getElementById('toast');
    },

    show(message, duration = 3000) {
        if (!this.el) this.init();
        if (!this.el) return;

        clearTimeout(this.timeout);
        this.el.textContent = message;
        this.el.classList.add('show');

        this.timeout = setTimeout(() => {
            this.el.classList.remove('show');
        }, duration);
    }
};
