import React from "react";
import "./style.scss";

class Avatar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      src: ""
    }

  }
  static getDerivedStateFromProps(props, state) {
    return props;

  }

  render() {
    return (

      <span className="cp-avatar-wrapper">
        {this.state.src.uid ? ((this.state.src.avatar) ? <img className="cp-avatar" src={this.state.src.avatar} alt="User" /> : <div className="cp-avatar-alternate">{this.state.src.name.charAt(0)}</div>) : ((this.state.src.icon) ? <img className="cp-avatar" src={this.state.src.icon} alt="Group" /> : <div className="cp-avatar-alternate">{this.state.src.name.charAt(0)}</div>)}

      </span>

    );
  }
}



export default Avatar;
export const avatar=Avatar;
Avatar.defaultProps = {
  src: ""
};
