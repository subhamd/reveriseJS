/*
  Widget style as string to be inserted into the DOM
*/
export const style =
`
#rev-lang * {
  margin:0;
  padding:0;
}

#rev-lang {
	background: #004050;
	width: 70px;

	border-radius: 3px;
	text-align:center;
	position:fixed;
	bottom:1px;
  right: 1em;

	color: white;
	box-shadow:
		0 5px 15px 1px rgba(0, 0, 0, 0.4),
		0 0 200px 1px rgba(255, 255, 255, 0.5);
  z-index: 9999999;
  transition: all .3s;
  opacity: .5;
}

#rev-lang:hover {
  opacity:1;
}

#rev-lang h3 {
	font-size: 15px;
	line-height: 60px;
	border-radius: 3px;
	cursor: pointer;
	background: #003040;
	background: linear-gradient(#003040, #002535);
}

#rev-lang h3:hover {
	text-shadow: 0 0 1px rgba(255, 255, 255, 0.8);
}

#rev-lang li {
	list-style-type: none;
}

#rev-lang ul ul {
  overflow:hidden;
  transition: height .3s;
  user-select: none;
}

#rev-lang ul ul li a {
	color: white;
	text-decoration: none;
	font-size: 16px;
	line-height: 36px;
	display: block;
	transition: all 0.20s;
}

#rev-lang ul ul li a:hover,
#rev-lang ul ul li.active a {
	background: #003545;
	border-left: 5px solid lightgreen;
}

`;
