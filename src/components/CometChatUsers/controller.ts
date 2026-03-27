import { CometChat } from "@cometchat/chat-sdk-javascript";

type Args = {
    searchText: string,
    usersRequestBuilder: CometChat.UsersRequestBuilder | null,
    searchRequestBuilder: CometChat.UsersRequestBuilder | null
    usersSearchText:React.MutableRefObject<string>,
};

export class UsersManager {
    private usersRequest: CometChat.UsersRequest;
    private static defaultLimit = 30;

    /**
     * Set `usersRequest` of the instance
     */
    constructor(args: Args) {
        const {
            searchText,
            usersRequestBuilder,
            searchRequestBuilder,
            usersSearchText
        } = args;
        
        let currentUsersRequestBuilder = usersRequestBuilder || this.getDefaultRequestBuilder(); // Use provided builder or create a new one if not provided
        if(searchText && searchRequestBuilder) {
            currentUsersRequestBuilder = searchRequestBuilder;
            currentUsersRequestBuilder.setSearchKeyword(searchText)
        }else if(searchText && !searchRequestBuilder && usersRequestBuilder){
            currentUsersRequestBuilder = usersRequestBuilder;
            currentUsersRequestBuilder.setSearchKeyword(searchText)
        }else if(!searchText && usersRequestBuilder && searchRequestBuilder){
            currentUsersRequestBuilder = usersRequestBuilder;
            currentUsersRequestBuilder.setSearchKeyword(usersSearchText.current)
        }else if(!searchText && usersRequestBuilder && !searchRequestBuilder){
            currentUsersRequestBuilder = usersRequestBuilder;
            currentUsersRequestBuilder.setSearchKeyword(usersSearchText.current)
        }else if(!searchText && !usersRequestBuilder && searchRequestBuilder){
            currentUsersRequestBuilder = this.getDefaultRequestBuilder();
            currentUsersRequestBuilder.setSearchKeyword(usersSearchText.current)
        }else{
            currentUsersRequestBuilder.setSearchKeyword(searchText)
        }
        this.usersRequest = currentUsersRequestBuilder.build();
    }

    private getDefaultRequestBuilder() {
        return new CometChat.UsersRequestBuilder().setLimit(UsersManager.defaultLimit);
    }

    /**
     * Calls `fetchNext` method of the set `usersRequest`
     */
    fetchNext() {
        return this.usersRequest.fetchNext();
    }

    getCurrentPage(): number {
        return (this.usersRequest as any).pagination.current_page;
    }

    /**
* Attaches an SDK websocket  listener
*
* @returns - Function to remove the added SDK websocket listener
*/
    static attachConnestionListener(callback: () => void) {
        const listenerId = "UsersList_connection_" + String(Date.now());
        CometChat.addConnectionListener(
            listenerId,
            new CometChat.ConnectionListener({
                onConnected: () => {
                    if (callback) {
                        callback()
                    }
                },
                onDisconnected: () => {
                }
            })
        );
        return () => CometChat.removeConnectionListener(listenerId);
    }
}
