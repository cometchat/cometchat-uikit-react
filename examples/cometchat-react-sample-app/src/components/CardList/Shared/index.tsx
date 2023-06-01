import { SoundManager } from "./Bubbles/SoundManager";
import { Theme } from "./Bubbles/Theme";
import { AudioBubble } from "./Bubbles/AudioBubble";
import { FileBubble } from "./Bubbles/FileBubble";
import { VideoBubble } from "./Bubbles/VideoBubble";
import { TextBubble } from "./Bubbles/TextBubble";
import { ImageBubble } from "./Bubbles/ImageBubble";
import { Receipt } from "./Bubbles/Receipt";
import { Badge } from "./Bubbles/Badge";
import { StatusIndicator } from "./Bubbles/StatusIndicator";
import { Avatar } from "./Bubbles/Avatar";
import { ListItem } from "./Bubbles/ListItem";
import { Localize } from "./Bubbles/Localize";

const Shared = (props:any) => {
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    return (
      <>
        <SoundManager activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <Theme activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <FileBubble activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <AudioBubble activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <VideoBubble activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <ImageBubble activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <TextBubble activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <Receipt activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <Badge activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <StatusIndicator activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <Avatar activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <Localize activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
        <ListItem activeComponent={activeComponent} handleCloseComponentModal={handleCloseComponentModal} showComponentModal={showComponentModal} />
      </>
      )
}
export { Shared };