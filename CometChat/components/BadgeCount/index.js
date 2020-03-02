import React from "react";
import "./style.scss";


class BadgeCount extends React.Component {
  constructor(props){
    super(props)
    this.state={
      count:""
  }

  }
  static getDerivedStateFromProps(props,state){    
    return props;
    
  }
  
  render() {
    return (  
      <>
      {(this.state.count>0)? <div className="cp-badge-wrapper">
      <span className="cp-badge" >{((this.state.count)? this.state.count:"")}</span>    
         </div>:""} 
     
         </>
    );
  }
}



export  default BadgeCount;
export const badgeCount=BadgeCount;
BadgeCount.defaultProps = {
  src:""
};
