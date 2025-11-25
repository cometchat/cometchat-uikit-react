
import {
  JSX,
  useCallback,
  useContext,
  useReducer,
  useRef,
} from "react";
import {
  useCometChatErrorHandler,
  useRefSync,
  useStateRef,
} from "../../CometChatCustomHooks";

import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatCheckbox } from "../BaseComponents/CometChatCheckbox/CometChatCheckbox";
import { CometChatList } from "../BaseComponents/CometChatList/CometChatList";
import { CometChatListItem } from "../BaseComponents/CometChatListItem/CometChatListItem";
import { CometChatRadioButton } from "../BaseComponents/CometChatRadioButton/CometChatRadioButton";
import { GroupMembersManager } from "./controller";
import { Hooks } from "./useCometChatGroupMembers";
import { CometChatUIKitUtility } from "../../CometChatUIKit/CometChatUIKitUtility";
import { GroupMemberUtils } from "../../utils/GroupMemberUtils";
import { Placement, SelectionMode, States } from "../../Enums/Enums";
import { CometChatActionsIcon, CometChatOption } from "../../modals";
import {getLocalizedString} from "../../resources/CometChatLocalize/cometchat-localize";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { CometChatChangeScope, } from "../BaseComponents/CometChatChangeScope/CometChatChangeScope";
import { CometChatContextMenu } from "../BaseComponents/CometChatContextMenu/CometChatContextMenu";
import emptyIcon from "../../assets/groups_empty_state.svg";
import emptyIconDark from "../../assets/groups_empty_state_dark.svg";
import errorIcon from "../../assets/list_error_state_icon.svg"
import errorIconDark from "../../assets/list_error_state_icon_dark.svg"
import { CometChatGroupEvents } from "../../events/CometChatGroupEvents";
import { getThemeMode } from "../../utils/util";

interface GroupMembersProps {
  /**
   * Hides the default search bar.
   *
   * @defaultValue `false`
   */
  hideSearch?: boolean;

  /**
   * Hides the default and custom error view passed in `errorView` prop.
   *
   * @defaultValue `false`
   */
  hideError?: boolean;

  /**
   * Disables the loading state while fetching users.
   *
   * @defaultValue `false`
   */
  disableLoadingState?: boolean;

  /**
   * Hides the option to kick a member from the group.
   *
   * @defaultValue `false`
   */
  hideKickMemberOption?: boolean;

  /**
   * Hides the option to ban a member from the group.
   *
   * @defaultValue `false`
   */
  hideBanMemberOption?: boolean;

  /**
   * Hides the option to change the scope of a group member.
   *
   * @defaultValue `false`
   */
  hideScopeChangeOption?: boolean;

  /**
   * Hides the user's online/offline status indicator.
   *
   * @defaultValue `false`
   */
  hideUserStatus?: boolean;

  /**
   * The group for which members are being fetched.
   */
  group: CometChat.Group;

  /**
   * Request builder to fetch group members.
   *
   * @defaultValue Default request builder having the limit set to `30`.
   */
  groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;

  /**
   * Request builder with search parameters to fetch group members.
   *
   * @remarks If the search input is not empty, the search keyword of this request builder is set to the text in the search input.
   */
  searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;

  /**
   * The keyword used to filter the group members list.
   *
   * @defaultValue `""`
   */
  searchKeyword?: string;

  /**
   * A function that returns a list of actions available when hovering over a group member item.
   *
   * @param group - The group instance.
   * @param groupMember - An instance of `CometChat.GroupMember` representing the group member.
   * @returns An array of `CometChatOption`.
   */
  options?: (group: CometChat.Group, groupMember: CometChat.GroupMember) => CometChatOption[];

  /**
   * Selection mode to use for the default list item view.
   *
   * @defaultValue `SelectionMode.none`
   */
  selectionMode?: SelectionMode;

  /**
   * Callback function invoked when an error occurs in the component.
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * Callback function invoked when a group member item is clicked.
   *
   * @param groupMember - An instance of `CometChat.GroupMember` representing the group member.
   * returns void
   */
  onItemClick?: (groupMember: CometChat.GroupMember) => void;

  /**
   * Callback function invoked when a group member is selected or deselected.
   *
   * @param groupMember - An instance of `CometChat.GroupMember` representing the group member.
   * @param selected - Boolean value to identify if the member is selected or removed.
   * @returns void
   */
  onSelect?: (groupMember: CometChat.GroupMember, selected: boolean) => void;

  /**
   * Callback function invoked when the group members list is empty.
   * @returns void
   */
  onEmpty?: () => void;

  /**
   * A custom component to render in the top-right corner of the group members list.
   */
  headerView?: JSX.Element;

  /**
   * A custom view to display during the loading state.
   */
  loadingView?: JSX.Element;

  /**
   * Custom view for the error state of the component.
   */
  errorView?: JSX.Element;

  /**
   * A custom view to display when no group members are available in the list.
   */
  emptyView?: JSX.Element;

  /**
   * A custom view to render for each group member in the fetched list.
   *
   * @param groupMember - An instance of `CometChat.GroupMember` representing the group member.
   * @returns A JSX element to be rendered as the group member item.
   */
  itemView?: (groupMember: CometChat.GroupMember) => JSX.Element;

  /**
   * A function that renders a JSX element to display the leading view.
   *
   * @param groupMember - An instance of `CometChat.GroupMember` representing the group member.
   * @returns A JSX element to be rendered as the leading view.
   */
  leadingView?: (groupMember: CometChat.GroupMember) => JSX.Element;

  /**
   * A function that renders a JSX element to display the title view.
   *
   * @param groupMember - An instance of `CometChat.GroupMember` representing the group member.
   * @returns A JSX element to be rendered as the title view.
   */
  titleView?: (groupMember: CometChat.GroupMember) => JSX.Element;

  /**
   * A function that renders a JSX element to display the subtitle view.
   *
   * @param groupMember - An instance of `CometChat.GroupMember` representing the group member.
   * @returns A JSX element to be rendered as the subtitle view.
   */
  subtitleView?: (groupMember: CometChat.GroupMember) => JSX.Element;

  /**
   * A function that renders a JSX element to display the trailing view.
   *
   * @param groupMember - An instance of `CometChat.GroupMember` representing the group member.
   * @returns A JSX element to be rendered as the trailing view.
   */
  trailingView?: (groupMember: CometChat.GroupMember) => JSX.Element;

  /**
   * Controls the visibility of the scrollbar in the list.
   * @defaultValue `false`
   */
    showScrollbar?: boolean;
}

type State = {
  groupMemberList: CometChat.GroupMember[];
  fetchState: States;
  searchText: string;
  groupMemberToChangeScopeOf: CometChat.GroupMember | null;
  disableLoadingState: boolean;
};

export type Action =
  | {
    type: "appendGroupMembers";
    groupMembers: CometChat.GroupMember[];
    groupMembersManager?: GroupMembersManager | null;
    onEmpty?: () => void;
    disableLoadingState?: boolean;
    hasScrolled?:boolean
  }
  | { type: "setGroupMemberList"; groupMemberList: CometChat.GroupMember[] }
  | { type: "setSearchText"; searchText: string }
  | { type: "setFetchState"; fetchState: States }
  | { type: "removeGroupMemberIfPresent"; groupMemberUid: string }
  | {
    type: "setGroupMemberToChangeScopeOf";
    groupMember: CometChat.GroupMember | null;
  }
  | {
    type: "replaceGroupMemberIfPresent";
    updatedGroupMember: CometChat.GroupMember;
  }
  | { type: "updateGroupMemberStatusIfPresent"; user: CometChat.User }
  | {
    type: "updateGroupMemberScopeIfPresent";
    groupMemberUid: string;
    newScope: CometChat.GroupMemberScope;
  }
  | { type: "appendGroupMember"; groupMember: CometChat.GroupMember };

function stateReducer(state: State, action: Action): State {
  let newState = state;
  const { type } = action;
  switch (type) {
    case "appendGroupMembers": {
      const { groupMembers, groupMembersManager, onEmpty, disableLoadingState,hasScrolled } = action;
      if (
        groupMembersManager &&
        [0].includes(groupMembersManager?.getCurrentPage()) &&
        !groupMembers.length
      ) {
        if (onEmpty) {
          setTimeout(() => {
            onEmpty();
          });
        }
        newState = {
          ...state,
          groupMemberList: [],
          fetchState: States.empty,
        };
      } else if (groupMembers.length !== 0) {
        const existingIds = new Set(state.groupMemberList.map(member => member.getUid()));
        const newUniqueMembers = disableLoadingState ? groupMembers : groupMembers.filter(member => !existingIds.has(member.getUid()));
        newState = {
          ...state,
          groupMemberList: disableLoadingState && !hasScrolled
            ? [...newUniqueMembers]
            : [...state.groupMemberList, ...newUniqueMembers],
        };
      }
      break;
    }
    case "setSearchText":
      newState = { ...state, searchText: action.searchText };
      break;
    case "setFetchState":
      newState = { ...state, fetchState: action.fetchState };
      break;
    case "setGroupMemberList":
      newState = { ...state, groupMemberList: action.groupMemberList };
      break;
    case "removeGroupMemberIfPresent": {
      const targetUid = action.groupMemberUid;
      const targetIdx = state.groupMemberList.findIndex(
        (groupMember) => groupMember.getUid() === targetUid
      );
      if (targetIdx > -1) {
        newState = {
          ...state,
          groupMemberList: state.groupMemberList.filter(
            (groupMember, i) => i !== targetIdx
          ),
        };
      }
      break;
    }
    case "setGroupMemberToChangeScopeOf":
      newState = { ...state, groupMemberToChangeScopeOf: action.groupMember };
      break;
    case "replaceGroupMemberIfPresent": {
      const { updatedGroupMember } = action;
      const targetUid = updatedGroupMember.getUid();
      const targetIdx = state.groupMemberList.findIndex(
        (groupMember) => groupMember.getUid() === targetUid
      );
      if (targetIdx > -1) {
        newState = {
          ...state,
          groupMemberList: state.groupMemberList.map((groupMember, i) => {
            if (i !== targetIdx) {
              return groupMember;
            }

            return updatedGroupMember;
          }),
        };
      }
      break;
    }
    case "updateGroupMemberStatusIfPresent": {
      const { user } = action;
      const { groupMemberList } = state;
      const targetUid = user.getUid();
      const targetIdx = groupMemberList.findIndex(
        (groupMember) => groupMember.getUid() === targetUid
      );
      if (targetIdx > -1) {
        newState = {
          ...state,
          groupMemberList: groupMemberList.map((groupMember, i) => {
            if (i === targetIdx) {
              groupMember.setStatus(user.getStatus());
            }
            return groupMember;
          }),
        };
      }
      break;
    }
    case "updateGroupMemberScopeIfPresent": {
      const { groupMemberUid, newScope } = action;
      const { groupMemberList } = state;
      const targetIdx = groupMemberList.findIndex(
        (groupMember) => groupMember.getUid() === groupMemberUid
      );
      if (targetIdx > -1) {
        newState = {
          ...state,
          groupMemberList: groupMemberList.map((groupMember, i) => {
            if (i === targetIdx) {
              groupMember.setScope(newScope);
            }
            return groupMember;
          }),
        };
      }
      break;
    }
    case "appendGroupMember": {
      newState = {
        ...state,
        groupMemberList: [...state.groupMemberList, action.groupMember],
      };
      break;
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const x: never = type;
    }
  }
  return newState;
}

export function CometChatGroupMembers(props: GroupMembersProps) {
  const {
    headerView,
    hideSearch = false,
    groupMemberRequestBuilder = null,
    searchRequestBuilder = null,
    group,
    onError,
    loadingView,
    errorView,
    emptyView,
    hideError = false,
    hideUserStatus = false,
    subtitleView = null,
    itemView = null,
    options = null,
    trailingView = null,
    selectionMode = SelectionMode.none,
    onItemClick = null,
    onSelect = null,
    searchKeyword = "",
    onEmpty,
    disableLoadingState = false,
    hideBanMemberOption = false,
    hideKickMemberOption = false,
    hideScopeChangeOption = false,
    titleView,
    leadingView,
    showScrollbar = false,
  } = props;

  const [state, dispatch] = useReducer(stateReducer, {
    groupMemberList: [],
    fetchState: States.loading,
    searchText: "",
    groupMemberToChangeScopeOf: null,
    disableLoadingState,
  });
  const groupMembersManagerRef = useRef<GroupMembersManager | null>(null);
  const loggedInUserRef = useRef<CometChat.User | null>(null);
  const fetchNextIdRef = useRef("");

  const groupPropRef = useRefSync(group);
  const errorHandler = useCometChatErrorHandler(onError);
  const groupMembersSearchText = useRef<string>("");
  const searchPlaceholderTextRef = useRef<string>(getLocalizedString("member_search_placeholder"));
  /**
   * Updates the `searchText` state
   */
  const onSearchTextChange = useCallback(
    (searchText: string): void => {
      try {
        const trimmedText = searchText.trim();
        if (
          searchText.length === 0 ||
          trimmedText.length > 0
        ) {
          groupMembersSearchText.current = "";
          dispatch({ type: "setSearchText", searchText: trimmedText });
        }
      } catch (error) {
        errorHandler(error, 'onSearchTextChange');
      }
    },
    [dispatch]
  );

  /**
   * Initiates a fetch request and appends the fetched group members to the `groupMemberList` state
   *
   * @remarks
   * This function also updates the `fetchState` state
   *
   * @param fetchId - Fetch Id to decide if the fetched data should be appended to the `groupMemberList` state
   */
  const fetchNextAndAppendGroupMembers = useCallback(
    async (fetchId: string,hasScrolled?:boolean): Promise<void> => {
      const groupMembersManager = groupMembersManagerRef.current;
      if (!groupMembersManager) {
        return;
      }
      if (!disableLoadingState) {
        dispatch({ type: "setFetchState", fetchState: States.loading });
      }
      try {
        const groupMembers = await groupMembersManager.fetchNext();
        if (fetchId !== fetchNextIdRef.current) {
          return;
        }

        dispatch({
          type: "appendGroupMembers",
          groupMembers,
          groupMembersManager,
          onEmpty,
          disableLoadingState,
          hasScrolled
        });

        dispatch({ type: "setFetchState", fetchState: States.loaded });
      } catch (error) {
        dispatch({ type: "setFetchState", fetchState: States.error });
        errorHandler(error, 'fetchNextAndAppendGroupMembers');
      }
    },
    [disableLoadingState, dispatch, errorHandler, onEmpty]
  );

  /**
   * Creates an action message
   */
  const createActionMessage = useCallback(
    (
      actionOn: CometChat.GroupMember,
      action: string,
      group: CometChat.Group,
      loggedInUser: CometChat.User
    ): CometChat.Action | undefined => {
      try {
        const actionMessage = new CometChat.Action(
          group.getGuid(),
          CometChatUIKitConstants.MessageTypes.groupMember,
          CometChatUIKitConstants.MessageReceiverType.group,
          CometChatUIKitConstants.MessageCategory
            .action as CometChat.MessageCategory
        );
        actionMessage.setAction(action);
        actionMessage.setActionBy(CometChatUIKitUtility.clone(loggedInUser));
        actionMessage.setSender(CometChatUIKitUtility.clone(loggedInUser));
        actionMessage.setMessage(
          `${loggedInUser.getUid()} ${action} ${actionOn.getUid()}`
        );
        actionMessage.setActionFor(CometChatUIKitUtility.clone(group));
        actionMessage.setActionOn(CometChatUIKitUtility.clone(actionOn));
        actionMessage.setReceiver(CometChatUIKitUtility.clone(group));
        actionMessage.setConversationId("group_" + group.getGuid());
        actionMessage.setMuid(CometChatUIKitUtility.ID());
        actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        actionMessage.setReceiverType(
          CometChatUIKitConstants.MessageReceiverType.group
        );
        actionMessage.setData({
          extras: {
            scope: {
              new: actionOn.getScope(),
            },
          },
        });
        return actionMessage;
      } catch (error) {
        errorHandler(error, 'createActionMessage');
      }
    },
    []
  );

  /**
   * Bans the provided `groupMember`
   */
  const banGroupMember = async (
    groupMember: CometChat.GroupMember
  ): Promise<void> => {
    const loggedInUser = loggedInUserRef.current;
    if (!loggedInUser) {
      return;
    }
    try {
      const currentGroup = groupPropRef.current;
      await CometChat.banGroupMember(
        currentGroup.getGuid(),
        groupMember.getUid()
      );
      dispatch({
        type: "removeGroupMemberIfPresent",
        groupMemberUid: groupMember.getUid(),
      });
      const groupClone = CometChatUIKitUtility.clone(currentGroup);
      groupClone.setMembersCount(groupClone.getMembersCount() - 1);
      CometChatGroupEvents.ccGroupMemberBanned.next({
        kickedBy: CometChatUIKitUtility.clone(loggedInUser),
        kickedFrom: groupClone,
        kickedUser: CometChatUIKitUtility.clone(groupMember),
        message: createActionMessage(
          groupMember,
          CometChatUIKitConstants.groupMemberAction.BANNED,
          groupClone,
          loggedInUser
        )!,
      });
    } catch (error) {
      errorHandler(error, 'banGroupMember');
    }
  };

  /**
   * Kicks the provided `groupMember`
   */
  const kickGroupMember = async (
    groupMember: CometChat.GroupMember
  ): Promise<void> => {
    const loggedInUser = loggedInUserRef.current;
    if (!loggedInUser) {
      return;
    }
    try {
      const currentGroup = groupPropRef.current;
      await CometChat.kickGroupMember(
        currentGroup.getGuid(),
        groupMember.getUid()
      );
      dispatch({
        type: "removeGroupMemberIfPresent",
        groupMemberUid: groupMember.getUid(),
      });
      const groupClone = CometChatUIKitUtility.clone(currentGroup);
      groupClone.setMembersCount(groupClone.getMembersCount() - 1);
      CometChatGroupEvents.ccGroupMemberKicked.next({
        kickedBy: CometChatUIKitUtility.clone(loggedInUser),
        kickedFrom: CometChatUIKitUtility.clone(groupClone),
        kickedUser: CometChatUIKitUtility.clone(groupMember),
        message: createActionMessage(
          groupMember,
          CometChatUIKitConstants.groupMemberAction.KICKED,
          groupClone,
          loggedInUser
        )!,
      });
    } catch (error) {
      errorHandler(error, 'kickGroupMember');
    }
  };

  const { groupMemberToChangeScopeOf: groupMember } = state;

  /**
   * Updates the scope of the provided `groupMember`
   */
  const updateGroupMemberScope = useCallback(
    (newScope: string): Promise<void> => {
      return new Promise<void>(async (resolve, reject) => {
        const loggedInUser = loggedInUserRef.current;
        if (!groupMember || !loggedInUser) {
          return reject()
        }
        try {
          const newScopeCasted = newScope as CometChat.GroupMemberScope;
          const currentGroup = groupPropRef.current;
          await CometChat.updateGroupMemberScope(
            currentGroup.getGuid(),
            groupMember.getUid(),
            newScopeCasted
          );

          const updatedGroupMember = CometChatUIKitUtility.clone(groupMember);
          updatedGroupMember.setScope(newScopeCasted);
          dispatch({ type: "replaceGroupMemberIfPresent", updatedGroupMember });
          CometChatGroupEvents.ccGroupMemberScopeChanged.next({
            scopeChangedFrom: groupMember.getScope(),
            scopeChangedTo: updatedGroupMember.getScope(),
            message: createActionMessage(
              updatedGroupMember,
              CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE,
              currentGroup,
              loggedInUser
            )!,
            group: CometChatUIKitUtility.clone(currentGroup),
            updatedUser: CometChatUIKitUtility.clone(updatedGroupMember),
          });
          return resolve()
        } catch (error) {
          reject()
          errorHandler(error, 'updateGroupMemberScope');
        } finally {
          dispatch({ type: "setGroupMemberToChangeScopeOf", groupMember: null });
        }
      })
    },
    [errorHandler, dispatch, createActionMessage, groupMember, groupPropRef]
  );

  /**
   * Handles user created action on a groupMember from the fetched list
   */
  function handleActionOnGroupMember(
    action: string,
    groupMember: CometChat.GroupMember
  ): void | Promise<void> {
    try {
      if (action === CometChatUIKitConstants.GroupMemberOptions.ban) {
        return banGroupMember(groupMember);
      }
      if (action === CometChatUIKitConstants.GroupMemberOptions.kick) {
        return kickGroupMember(groupMember);
      }
      if (action === CometChatUIKitConstants.GroupMemberOptions.changeScope) {
        return dispatch({ type: "setGroupMemberToChangeScopeOf", groupMember });
      }
    } catch (error) {
      errorHandler(error, 'handleActionOnGroupMember');
    }
  }


  /**
   * Creates the menu view of the default list item view
   */
  function getDefaultListItemMenuView(
    groupMember: CometChat.GroupMember
  ): JSX.Element | null {
    try {
      let groupMemberOptionsProps: CometChatOption[] | undefined;
      let groupMemberOptions = GroupMemberUtils.getViewMemberOptions(
        groupMember,
        group,
        loggedInUserRef.current?.getUid(),
        { hideBanMemberOption, hideKickMemberOption, hideScopeChangeOption }
      )

      if (typeof groupMemberOptions === "string") {
        return null
      }

      if (
        trailingView === null &&
        (groupMemberOptionsProps = options?.(group, groupMember))?.length
      ) {
        return (
          <CometChatContextMenu
            placement={Placement.left}
            data={groupMemberOptionsProps as unknown as CometChatActionsIcon[]}
            onOptionClicked={(e: CometChatOption) => {
              const { id, onClick } = e;
              if (onClick) {
                onClick();
              } else if (typeof id === "string") {
                handleActionOnGroupMember(id, groupMember);
              }
            }}
          />
        );
      }
      return <>
        <CometChatContextMenu
          placement={Placement.left}
          topMenuSize={1}
          data={groupMemberOptions as unknown as CometChatActionsIcon[]}
          onOptionClicked={(e: CometChatOption) => {
            const { id, onClick } = e;
            if (onClick) {
              onClick();
            } else if (typeof id === "string") {
              handleActionOnGroupMember(id, groupMember);
            }
          }}
        />
      </>;
    } catch (error) {
      errorHandler(error, 'getDefaultListItemMenuView');
      return null;
    }
  }

  /**
   * Creates selection input component based on `selectionMode`
   */
  function getSelectionInput(
    groupMember: CometChat.GroupMember
  ): JSX.Element | null {
    try {
      if (selectionMode === SelectionMode.single) {
        return (
          <CometChatRadioButton
            name={CometChatUIKitConstants.radioNames.groupMembers}
            id={groupMember.getUid()}
            onRadioButtonChanged={(e) => onSelect?.(groupMember, e.checked)}
          />
        );
      }
      if (selectionMode === SelectionMode.multiple) {
        return (
          <CometChatCheckbox
            onCheckBoxValueChanged={(e) => onSelect?.(groupMember, e.checked)}
          />
        );
      }
      return null;
    } catch (error) {
      errorHandler(error, 'getSelectionInput');
      return null;
    }
  }

  /**
   * Creates options view of the default tail view
   *
   * @param groupMemberOptions - Return value of `GroupMemberUtils.getViewMemberOptions` function
   */
  function getDefaultTailOptionsView(
    groupMemberOptions: string | CometChatOption[],
    groupMember: CometChat.GroupMember
  ): JSX.Element {
    try {
      if (typeof groupMemberOptions === "string" && groupMemberOptions !== "participant") {
        return (
          <div className={`cometchat-group-members__trailing-view-options cometchat-group-members__trailing-view-options-${groupMemberOptions}`}>
            {getLocalizedString(`member_scope_${groupMemberOptions.toLowerCase()}`)}
          </div>
        );
      }

      return <div className={`cometchat-group-members__trailing-view-options cometchat-group-members__trailing-view-options-${groupMember?.getScope()}`}>{groupMember?.getScope() !== CometChatUIKitConstants.groupMemberScope.participant && getLocalizedString(`member_scope_${groupMember?.getScope().toLowerCase()}`)}</div>
    } catch (error) {
      errorHandler(error, 'getDefaultTailOptionsView');
      return <></>;
    }
  }

  /**
   * Creates the default tail view
   */
  function getDefaultTailView(
    groupMember: CometChat.GroupMember
  ): JSX.Element | null {
    try {
      if (trailingView !== null) {
        return null;
      }
      return (
        <div className='cometchat-group-members__trailing-view'>
          {getDefaultTailOptionsView(
            GroupMemberUtils.getViewMemberOptions(
              groupMember,
              group,
              loggedInUserRef.current?.getUid()),
            groupMember,
          )}
        </div>
      );
    } catch (error) {
      errorHandler(error, 'getDefaultTailView');
      return null;
    }
  }

  /**
   * Creates the tail view for the default list item view
   */
  function getDefaultListItemTailView(
    groupMember: CometChat.GroupMember
  ): JSX.Element {
    try {
      return (
        <div>
          {trailingView?.(groupMember)}
          {getSelectionInput(groupMember)}
          {getDefaultTailView(groupMember)}
        </div>
      );
    } catch (error) {
      errorHandler(error, 'getDefaultListItemTailView');
      return <></>;
    }
  }


  /**
   * Creates the default list item view
   */
  function getDefaultItemView(
    groupMember: CometChat.GroupMember
  ): JSX.Element {
    try {
      const status = groupMember.getStatus()
      return (
        <div
          className={`cometchat-group-members__list-item ${!hideUserStatus ? `cometchat-group-members__list-item-${status}` : ''}`}
        >
          <CometChatListItem
            id={groupMember.getUid()}
            title={groupMember.getName()}
            leadingView={leadingView?.(groupMember)}
            titleView={titleView?.(groupMember)}
            avatarURL={groupMember.getAvatar()}
            avatarName={groupMember.getName()}
            subtitleView={subtitleView?.(groupMember)}
            trailingView={getDefaultListItemTailView(groupMember)}
            menuView={!trailingView ? getDefaultListItemMenuView(groupMember) : null}
            onListItemClicked={(e) => onItemClick?.(groupMember)}
          />
        </div>
      );
    } catch (error) {
      errorHandler(error, 'getDefaultItemView');
      return <></>;
    }
  }

  /**
   * Gets the list item view of the component
   */
  function getListItem(): (groupMember: CometChat.GroupMember) => JSX.Element {
    return itemView !== null ? itemView : getDefaultItemView;
  }

  /**
   * Closes the group member scope change modal by resetting the selected group member.
   * 
   * @returns {void}
   */
  function handleChangeScopeClose(): void {
    dispatch({ type: "setGroupMemberToChangeScopeOf", groupMember: null });
  }



  /**
   * Creates the group member scope change modal view
   */
  function getGroupMemberScopeChangeModal(): JSX.Element | null {
    try {
      let groupMemberAllowedScopes: string[];
      const { groupMemberToChangeScopeOf } = state;
      if (
        groupMemberToChangeScopeOf !== null &&
        (groupMemberAllowedScopes = GroupMemberUtils.allowScopeChange(
          group,
          groupMemberToChangeScopeOf
        )).length > 0

      ) {

        return (
          <div className="cometchat-group-members__backdrop">
            <CometChatChangeScope
              options={groupMemberAllowedScopes}
              defaultSelection={groupMemberToChangeScopeOf.getScope()}
              onScopeChanged={updateGroupMemberScope}
              onCloseClick={handleChangeScopeClose}
            />
          </div>
        );
      }
      return null;
    } catch (error) {
      errorHandler(error, 'getGroupMemberScopeChangeModal');
      return null;
    }
  }



  /**
   * Renders the loading state view with shimmer effect
   *
   * @remarks
   * If a custom `loadingView` is provided, it will be used. Otherwise, the default shimmer effect is displayed.
   *
   * @returns A JSX element representing the loading state
   */
  const getLoadingView = () => {
    try {
      if (loadingView) {
        return loadingView
      }
      return <div className="cometchat-group-members__shimmer">
        {[...Array(15)].map((_, index) => (
          <div key={index} className="cometchat-group-members__shimmer-item">
            <div className="cometchat-group-members__shimmer-item-avatar"></div>
            <div className="cometchat-group-members__shimmer-item-title"></div>
          </div>
        ))}
      </div>
    } catch (error) {
      errorHandler(error, 'getLoadingView');
    }
  }



  /**
   * Renders the empty state view when there are no groups to display
   *
   * @remarks
   * If a custom `emptyView` is provided, it will be used. Otherwise, a default empty state view with a message is displayed.
   *
   * @returns A JSX element representing the empty state
   */
  const getEmptyView = () => {
    try {
      const isDarkMode = getThemeMode() == "dark" ? true : false;

      if (emptyView) {
        return emptyView
      }
      return (
        <div className="cometchat-group-members__empty-state-view">
          <div className="cometchat-group-members__empty-state-view-icon">
            <img src={isDarkMode ? emptyIconDark : emptyIcon} alt="" />
          </div>
          <div className="cometchat-group-members__empty-state-view-body">
            <div className="cometchat-group-members__empty-state-view-body-title">{getLocalizedString("member_empty_title")}</div>
            <div className="cometchat-group-members__empty-state-view-body-description">{getLocalizedString("member_empty_subtitle")}</div>
          </div>
        </div>
      )
    } catch (error) {
      errorHandler(error, 'getEmptyView');
    }
  }

  /**
   * Renders the error state view when an error occurs
   *
   * @remarks
   * If a custom `errorView` is provided, it will be used. Otherwise, a default error message is displayed.
   *
   * @returns A JSX element representing the error state
   */
  const getErrorView = () => {
    try {
      const isDarkMode = getThemeMode() == "dark" ? true : false;

      if (errorView) {
        return errorView
      }

      return (
        <div className="cometchat-group-members__error-state-view">
          <div className="cometchat-group-members__error-state-view-icon">
            <img src={isDarkMode ? errorIconDark : errorIcon} alt="" />
          </div>
          <div className="cometchat-group-members__error-state-view-body">
            <div className="cometchat-group-members__error-state-view-body-title">{getLocalizedString("member_error_title")}</div>
            <div className="cometchat-group-members__error-state-view-body-description">{getLocalizedString("member_error_subtitle")}
            </div>
          </div>
        </div>
      )
    } catch (error) {
      errorHandler(error, 'getErrorView');
    }
  }


  Hooks({
    groupMemberRequestBuilder,
    searchRequestBuilder,
    searchText: state.searchText,
    groupMembersManagerRef,
    groupGuid: group.getGuid(),
    fetchNextAndAppendGroupMembers,
    fetchNextIdRef,
    dispatch,
    loggedInUserRef,
    errorHandler,
    updateGroupMemberScope,
    searchKeyword,
    disableLoadingState,
    groupMembersSearchText,
    hideUserStatus
  });

  return (
    <div className="cometchat" style={{ width: "100%", height: "100%" }}>
      <div
        className={`cometchat-group-members ${!showScrollbar ? 'cometchat-group-members-hide-scrollbar' : ''}`}
      >
        <CometChatList
          showScrollbar={showScrollbar}
          searchPlaceholderText={searchPlaceholderTextRef.current}
          searchText={state.searchText}
          onSearch={onSearchTextChange}
          hideSearch={hideSearch}
          list={state.groupMemberList}
          listItemKey='getUid'
          itemView={getListItem()}
          showSectionHeader={false}
          onScrolledToBottom={() =>
            fetchNextAndAppendGroupMembers(
              (fetchNextIdRef.current =
                "onScrolledToBottom_" + String(Date.now())),
                true
            )
          }
          state={state.fetchState === States.loaded && state.groupMemberList.length === 0 ? States.empty : state.fetchState}
          loadingView={getLoadingView()}
          emptyView={getEmptyView()}
          errorView={getErrorView()}
          hideError={hideError}
          headerView={headerView}

        />
        {getGroupMemberScopeChangeModal()}
      </div>

    </div>
  );
}