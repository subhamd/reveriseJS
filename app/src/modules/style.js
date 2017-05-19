/*
  Widget style as string to be inserted into the DOM
*/
export const style =
`
#reverise-container {
  position: fixed;
  z-index: 99999999;
  background-color: #444;
  overflow: hidden;
  border-radius: 3px;
  color: #AAA;
  bottom: 0;
  right: 1em;
}
#reverise-container.light {
  background-color: #FFF;
  color: #888;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}
#reverise-container.left {
  left: 0;
  right: auto;
  top: 50vh;
  bottom: auto;
  transform: translateY(-50%);
}
#reverise-container.right {
  left: auto;
  right: 0;
  top: 50vh;
  bottom: auto;
  transform: translateY(-50%);
}
#reverise-container.bottom-left {
  left: 1em;
  right: auto;
}
#reverise-container.light #reverise-container--header {
  color: #222;
  border-bottom: solid 1px #EEE;
}
#reverise-container #reverise-container--header {
  height: 3em;
  text-align: center;
  line-height: 3em;
  cursor: default;
  font-weight: bold;
  border-bottom: solid 1px #555;
  color: white;
  user-select: none;
}
#reverise-container.light ul li {
  border-bottom: solid 1px #EEE;
}
#reverise-container.light ul li.active, #reverise-container.light ul li:hover {
  color: #222;
}
#reverise-container ul {
  margin: 0;
  padding: 0;
  list-style-type: none;
  transition: all .4s ease-in;
}
#reverise-container ul li {
  padding: .5em 1em;
  cursor: pointer;
  border-bottom: solid 1px #555;
}
#reverise-container ul li.active, #reverise-container ul li:hover {
  color: #FFF;
}

`;
