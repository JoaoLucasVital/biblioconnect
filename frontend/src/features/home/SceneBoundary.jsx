import { Component } from "react";
export default class SceneBoundary extends Component {
  state = {failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){ /* A cena é decorativa; a alternativa mantém a navegação. */ }
  render(){return this.state.failed ? this.props.fallback : this.props.children;}
}
