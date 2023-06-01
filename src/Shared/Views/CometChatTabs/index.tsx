import { createComponent } from "@lit-labs/react";
import { CometChatDraggable, CometChatIconButton } from "my-cstom-package-lit";
import React, { useCallback, useRef, useState } from "react";
import { CometChatTabItem, IconButtonAlignment, TabAlignment } from "uikit-resources-lerna";
import { BaseStyle, TabItemStyle } from "uikit-utils-lerna";
import { ButtonStyle, TabsDivStyle, TabsPlacement, TabsStyle, TabsWrapperStyle } from "./style";

interface TabsProps {
    tabAlignment?: TabAlignment,
    tabsStyle?: BaseStyle,
    tabs?: CometChatTabItem[]
}

const defaultProps: TabsProps = {
    tabAlignment: TabAlignment.bottom,
    tabsStyle: {},
    tabs: []
}

const CometChatIconButtonBubble = createComponent({
    tagName: 'cometchat-icon-button',
    elementClass: CometChatIconButton,
    react: React,
    events: {
        'ccButtonClicked': 'cc-button-clicked'
    }
});

const CometChatDraggableComponent = createComponent({
    tagName: "cometchat-draggable",
    elementClass: CometChatDraggable,
    react: React
})

const CometChatTabs = (props: TabsProps) => {
    const {
        tabAlignment,
        tabsStyle,
        tabs
    } = props;

    const [activeTab, setActiveTab] = useState<CometChatTabItem | null>(null);
    const childViewRef = useRef(null);

    const openViewOnCLick = useCallback((tabItem: CometChatTabItem) => {
        if(tabs && tabs.length > 0){
            childViewRef.current = null;
            let index = tabs.findIndex(
                (item: CometChatTabItem) => item.id === tabItem.id
            );
            if (index > -1) {
                setActiveTab(tabItem);
                childViewRef.current = tabs[index].childView;
            }
        }
    }, [childViewRef, tabs])

    const getButtonStyle = useCallback((tab: CometChatTabItem) => {
        const { style } = tab || {};
        const { id } = activeTab || {};
        const active = id === tab?.id;

        return ButtonStyle(style as TabItemStyle, active);
    }, [activeTab])

    const getTabsStyle = useCallback(() => {
        return TabsStyle(tabsStyle as BaseStyle, tabAlignment as TabAlignment);
    }, [tabAlignment, tabsStyle]);

    const getTabsPlacement = useCallback(() => {
        return TabsPlacement(tabAlignment as TabAlignment);
    }, [tabAlignment]);

    return (
        <div className="cc-tabs-wrapper" style={TabsWrapperStyle}>
            {childViewRef.current ? <div style={TabsDivStyle}> {childViewRef.current} </div> : null}
            <div className="cc-tabs" style={getTabsStyle()}>
                <CometChatDraggableComponent draggableStyle={tabsStyle}>
                    <div className="cc__tab-item" style={getTabsPlacement()}>
                        {
                            tabs?.map((tab) => {
                                return (
                                    <CometChatIconButtonBubble
                                        alignment={IconButtonAlignment.top}
                                        iconURL={tab.iconURL}
                                        text={tab.title}
                                        buttonStyle={getButtonStyle(tab)}
                                        ccButtonClicked={(e) => openViewOnCLick(tab)}
                                        key={tab.id}
                                    />
                                )
                            })
                        }
                    </div>
                </CometChatDraggableComponent>
            </div>
        </div>
    )
}

CometChatTabs.defaultProps = defaultProps;
export { CometChatTabs };