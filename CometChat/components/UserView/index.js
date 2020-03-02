import React from "react";
import "./style.scss";
import Avatar from "../Avatar";


class UserView extends React.Component {
  constructor(props){
    super(props);    
    this.state={
        user:{},        
    }

  }
  static getDerivedStateFromProps(props,state){    
    return props;
  }
  render() {
    return (
      <div className="cp-userview" onClick={()=>{ if(this.props.onClick)this.props.onClick(this.state.user)}}>
          <div className="row" >
              <div className="col-xs-1 cp-user-avatar">
              <Avatar src={this.state.user}></Avatar>
              </div>
              <div className="col cp-user-info">
              <div className="cp-username cp-ellipsis font-bold">
              {this.state.user.name}
              </div>              
              {/* <Row className="cp-userstatus"> 
              
                <span className={"text-muted "+ (this.state.user.status==="online" ? "online":"offline")} >{this.state.user.status} </span>
                </Row>   */}
              </div>
    
          </div>
         
         
        
         
      </div>
    );
  }
}



export  default UserView;
export const userView=UserView;

UserView.defaultProps = {
  user:{}
};
