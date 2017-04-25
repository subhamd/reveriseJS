angular.module('FashionComponentApp', [])
.controller('FashionDeals', function() {

	this.cards = [
		{
			img: 'https://rukminim1.flixcart.com/image/400/400/watch/s/r/h/s7753bl-sanda-original-imaezg3kjt4juhqj.jpeg?q=70',
			title: 'IBSO Sandra...',
			price: '50% Discount'
		},
		{
			img: 'https://rukminim1.flixcart.com/image/400/400/wallet-card-wallet/z/q/f/7171301-puma-wallet-leather-wallet-original-imae62sf4uajfm88.jpeg?q=70',
			title: 'Peter England Wallets',
			price: 'Under ₹950'
		},
		{
			img: 'https://rukminim1.flixcart.com/merch/400/400/images/1481189782900.jpg?q=70',
			title: 'Puma, Adidas, Nike',
			price: '50-60% discount'
		}
	]
})