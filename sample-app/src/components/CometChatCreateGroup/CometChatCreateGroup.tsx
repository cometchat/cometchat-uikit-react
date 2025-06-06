import React, { useContext, useState } from 'react';
import "../../styles/CometChatCreateGroup/CometChatCreateGroup.css";
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { AppContext } from '../../context/AppContext';
import { CometChatGroupEvents, localize } from '@cometchat/chat-uikit-react';


interface CreateGroupProps {
  setShowCreateGroup: React.Dispatch<React.SetStateAction<boolean>>;
  onGroupCreated?: (group: CometChat.Group) => void;
}

const CometChatCreateGroup = ({ setShowCreateGroup, onGroupCreated = () => { } }: CreateGroupProps) => {
  const [groupType, setGroupType] = useState("public");
  const [groupName, setGroupName] = useState("");
  const [isGroupCreated, setIsGroupCreated] = useState(false);
  const [groupPassword, setGroupPassword] = useState("");
  const { setAppState } = useContext(AppContext);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isGroupCreated) {
      setIsGroupCreated(true);
      const GUID = `group_${new Date().getTime()}`;
      const group = new CometChat.Group(GUID, groupName, groupType, groupPassword);
      try {
        const createdGroup = await CometChat.createGroup(group);
        CometChatGroupEvents.ccGroupCreated.next(createdGroup)
        onGroupCreated(createdGroup);
        setAppState({ type: "updateSelectedItemGroup", payload: createdGroup });
        console.log("Group created successfully:", createdGroup);
        setShowCreateGroup(false);
      } catch (error) {
        console.error("Group creation failed with exception:", error);
      }
    }
  }

  return (
    <div className='cometchat-create-group__backdrop'>
      <form className='cometchat-create-group' onSubmit={handleSubmit}>
        <div className='cometchat-create-group__title'>{localize("NEW__GROUP")}</div>
        <div className='cometchat-create-group__content'>
          <div
            className='cometchat-create-group__type-wrapper'
          >
            <span className='cometchat-create-group__type-text'>{localize("TYPE")}</span>
            <div className='cometchat-create-group__type-content'>
              <div
                className={`cometchat-create-group__type ${groupType === "public" ? "cometchat-create-group__type-selected" : ""}`}
                onClick={() => setGroupType("public")}>
                {localize("PUBLIC")}
              </div>
              <div
                className={`cometchat-create-group__type ${groupType === "private" ? "cometchat-create-group__type-selected" : ""}`}
                onClick={() => setGroupType("private")}>
                    {localize("PRIVATE")}
              </div>
              <div
                className={`cometchat-create-group__type ${groupType === "password" ? "cometchat-create-group__type-selected" : ""}`}
                onClick={() => setGroupType("password")}>
                 {localize("PASSWORD")}
              </div>
            </div>
          </div>

          <div className='cometchat-create-group__name-wrapper'>
          {localize("NAME")}
            <input
              type="text"
              className='cometchat-create-group__input'
              placeholder='Enter the group name'
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>
          {groupType === "password" && (
            <div className='cometchat-create-group__password-wrapper'>
                 {localize("PASSWORD")}
              <input
                autoComplete="new-password"
                type="password"
                className='cometchat-create-group__input'
                placeholder='Enter a password'
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                required
              />
            </div>
          )}
        </div>
        <button className='cometchat-create-group__submit-button' type='submit'>
        {localize("CREATE_GROUP")}
        </button>
        <div className='cometchat-create-group__close-button' onClick={() => setShowCreateGroup(false)} />

      </form>
    </div>
  );
};

export default CometChatCreateGroup;