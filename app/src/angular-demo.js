angular.module('ang-demo', [])
.controller('demoCtrl', function($scope) {
 $scope.items = [
 	{
 		header: 'Birds in North America and Europe Are Quickly Packing Their Bags',
 		body: 'Decades of data show that climate change is manipulating the way species move across continents.',
 		src: 'http://d2fbmjy3x0sdua.cloudfront.net/sites/default/files/styles/engagement_card/public/sfw_apa_2013_28342_232388_briankushner_blue_jay_kk_high.jpg?itok=ttMfUhUu'
 	},
 	{
 		header: 'Bird Dream Symbolism',
 		body: 'Freud thought that the bird represented the phallus and that flying represented the sexual act. Although in many countries the word ‘bird’ means a girl or woman, in Italy it means the male organ.',
 		src: 'http://weknownyourdreamz.com/images/birds/birds-01.jpg',
 	},
 	{
 		header: 'bird breeds',
 		body: 'spread your wings with an easy-to-care-for &amp; social family pet.',
 		src: 'http://s7d2.scene7.com/is/image/PetSmart/ARFEAT-CaringForYourBird-20160818?$CL0601$'
 	}];

})