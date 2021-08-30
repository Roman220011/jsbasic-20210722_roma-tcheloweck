import createElement from '../../assets/lib/create-element.js';
import escapeHtml from '../../assets/lib/escape-html.js';

import Modal from '../../7-module/2-task/index.js';

export default class Cart {
  cartItems = []; // [product: {...}, count: N]

  constructor(cartIcon) {
    this.cartIcon = cartIcon;

    this.addEventListeners();
  }

  addProduct(product) {
    // eslint-disable-next-line curly
    if (product == null || product == undefined) return;

    let isItemInList = false;

    this.cartItems.forEach((item, index) => {
      if (product === item.product) {
        this.cartItems[index].count++;
        isItemInList = true;
      }
    });

    if (!isItemInList) {
      let cartItem = {
        product: product, 
        count: 1
      };

      this.cartItems.push(cartItem);
    }
    
    this.onProductUpdate(this.cartItems[this.cartItems.length - 1]);
  }

  updateProductCount(productId, amount) {
    let i = 0;
    for (; i < this.cartItems.length; i++) {
      if (this.cartItems[i].product.id === productId) {
        this.cartItems[i].count += amount;
        break;
      }
    }

    // eslint-disable-next-line curly
    if (i === this.cartItems.length) return;
    
    this.onProductUpdate(this.cartItems[i], i);
  }

  isEmpty() {
    for (const item of this.cartItems) {
      return false;
    }
    return true;
  }

  getTotalCount() {
    return this.cartItems.reduce((sum, item) => sum + item.count, 0);
  }

  getTotalPrice() {
    return this.cartItems.reduce((sum, item) => sum + item.count * item.product.price, 0);
  }

  renderProduct(product, count) {
    return createElement(`
    <div class="cart-product" data-product-id="${product.id}">
      <div class="cart-product__img">
        <img src="/assets/images/products/${product.image}" alt="product">
      </div>
      <div class="cart-product__info">
        <div class="cart-product__title">${escapeHtml(product.name)}</div>
        <div class="cart-product__price-wrap">
          <div class="cart-counter">
            <button type="button" class="cart-counter__button cart-counter__button_minus">
              <img src="/assets/images/icons/square-minus-icon.svg" alt="minus">
            </button>
            <span class="cart-counter__count">${count}</span>
            <button type="button" class="cart-counter__button cart-counter__button_plus">
              <img src="/assets/images/icons/square-plus-icon.svg" alt="plus">
            </button>
          </div>
          <div class="cart-product__price">€${product.price.toFixed(2)}</div>
        </div>
      </div>
    </div>`);
  }

  renderOrderForm() {
    return createElement(`<form class="cart-form">
      <h5 class="cart-form__title">Delivery</h5>
      <div class="cart-form__group cart-form__group_row">
        <input name="name" type="text" class="cart-form__input" placeholder="Name" required value="Santa Claus">
        <input name="email" type="email" class="cart-form__input" placeholder="Email" required value="john@gmail.com">
        <input name="tel" type="tel" class="cart-form__input" placeholder="Phone" required value="+1234567">
      </div>
      <div class="cart-form__group">
        <input name="address" type="text" class="cart-form__input" placeholder="Address" required value="North, Lapland, Snow Home">
      </div>
      <div class="cart-buttons">
        <div class="cart-buttons__buttons btn-group">
          <div class="cart-buttons__info">
            <span class="cart-buttons__info-text">total</span>
            <span class="cart-buttons__info-price">€${this.getTotalPrice().toFixed(2)}</span>
          </div>
          <button type="submit" class="cart-buttons__button btn-group__button button">order</button>
        </div>
      </div>
    </form>`);
  }

  renderModal() {
    this.modalWindow = new Modal();
    this.modalWindow.setTitle("Your order");

    let div = document.createElement('div');
    for (const item of this.cartItems) {
      div.append(this.renderProduct(item.product, item.count));
    }
    div.append(this.renderOrderForm());

    let changeCount = (event) => {
      if (event.target.closest(`button[type="submit"]`)) {
        return;
      }
      let id = event.target.closest('.cart-product').dataset.productId;

      if (event.target.closest('.cart-counter__button_minus')) {
        this.updateProductCount(id, -1);
      } else if (event.target.closest('.cart-counter__button_plus')) {
        this.updateProductCount(id, 1);
      }
    };
    div.addEventListener('click', changeCount);

    div.querySelector('.cart-form').addEventListener('submit', this.onSubmit);

    this.modalWindow.setBody(div);

    this.modalWindow.open();

    return this.modalWindow.elem;
  }

  onProductUpdate(cartItem, index = 0) {
    this.cartIcon.update(this);

    // eslint-disable-next-line curly
    if (!document.body.classList.contains('is-modal-open')) return;

    let id = cartItem.product.id;

    if (cartItem.count <= 0) {
      let productItemElement = this.modalWindow.elem.querySelector(`[data-product-id="${id}"]`);
      productItemElement.remove();

      this.cartItems.splice(index, 1);

      if (this.isEmpty()) {
        this.cartIcon.update(this);
        this.modalWindow.close();
      }
      return;
    }

    let modalBody = this.modalWindow.elem;
    let productCount = modalBody.querySelector(`[data-product-id="${id}"] .cart-counter__count`);
    let productPrice = modalBody.querySelector(`[data-product-id="${id}"] .cart-product__price`);
    let infoPrice = modalBody.querySelector(`.cart-buttons__info-price`);

    productCount.innerHTML = cartItem.count;
    productPrice.innerHTML = "€" + (cartItem.product.price * cartItem.count).toFixed(2);
    infoPrice.innerHTML = "€" + this.getTotalPrice().toFixed(2);
  }

  onSubmit = (event) => {
    event.preventDefault();
    
    let button = this.modalWindow.elem.querySelector('button[type="submit"]');
    button.classList.add('is-loading');

    let formData = new FormData(this.modalWindow.elem.querySelector('.cart-form'));
    fetch("https://httpbin.org/post", {
      method: 'POST',
      body: formData
    }).then(response => {
      if (response.ok) {
        this.modalWindow.setTitle(`'Success!'`);
        this.cartItems.length = 0;
        this.modalWindow.setBody(createElement(`
          <div class="modal__body-inner">
            <p>
              Order successful! Your order is being cooked :) <br>
              We’ll notify you about delivery time shortly.<br>
              <img src="/assets/images/delivery.gif">
            </p>
          </div>
        `));
        this.cartIcon.update(this);
      }
    });
  }

  addEventListeners() {
    this.cartIcon.elem.onclick = () => this.renderModal();
  }
}

