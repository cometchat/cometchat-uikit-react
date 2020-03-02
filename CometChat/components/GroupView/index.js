import React from "react";
import "./style.scss";
import Avatar from "../Avatar";


class GroupView extends React.Component {
  constructor(props){
    super(props);    
    this.state={
        group:{},        
    }

  }
  static getDerivedStateFromProps(props,state){    
    return props;
  }
  render() {
    return (
      <div className="cp-groupview" onClick={()=>{ if(this.props.onClick)this.props.onClick(this.state.group)}}>
          <div className="row">
              <div className="col-xs-1 cp-group-icon">
              <Avatar src={this.state.group}></Avatar>
              </div>
              <div className="col cp-user-info">
              <div className="cp-username font-bold cp-ellipsis">
              {this.state.group.name}
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



export  default GroupView;
export const groupView=GroupView;

GroupView.defaultProps = {
  group:{}
};
