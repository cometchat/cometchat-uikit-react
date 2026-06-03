/**
 * CometChatFullScreenViewer Storybook Stories
 *
 * The fullscreen viewer uses position:fixed by default. Stories override
 * it to position:relative via a wrapper so the component renders inline
 * within the Storybook docs page (matching the Angular approach).
 *
 * @module components/cometchat-fullscreen-viewer
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CometChatFullScreenViewer } from './CometChatFullScreenViewer';
import type { CometChatMediaAttachment } from './CometChatFullScreenViewer.types';

const SAMPLE_IMAGE_1 = 'https://placehold.co/1920x1080/6852D6/FFFFFF?text=Landscape+1';
const SAMPLE_IMAGE_2 = 'https://placehold.co/1920x1080/0B7BEA/FFFFFF?text=Landscape+2';
const SAMPLE_IMAGE_3 = 'https://placehold.co/1920x1080/09C26F/FFFFFF?text=Landscape+3';
const SAMPLE_VIDEO = 'https://www.w3schools.com/html/mov_bbb.mp4';
const SAMPLE_FILE = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const SAMPLE_AVATAR = '/avatars/andrew-joseph.png';

/**
 * Inline wrapper style that overrides position:fixed to relative
 * so the viewer renders inline in Storybook docs.
 */
const viewerWrapperStyle = `
  .cometchat-fullscreen-viewer-story-wrapper .cometchat-fullscreen-viewer {
    position: relative !important;
    inset: auto !important;
    z-index: 1 !important;
    width: 100% !important;
    height: 500px !important;
    border-radius: 8px;
  }
`;

function ViewerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="cometchat-fullscreen-viewer-story-wrapper"
      style={{ width: '100%', height: 500, overflow: 'hidden', borderRadius: 8 }}
    >
      <style>{viewerWrapperStyle}</style>
      {children}
    </div>
  );
}

const meta: Meta = {
  title: 'Components/Misc/FullScreen Viewer',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A fullscreen media viewer for images and videos with gallery navigation. Previews below are rendered inline with constrained height.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

/** Single image viewer with sender info. */
export const SingleImage: Story = {
  render: () => (
    <ViewerWrapper>
      <CometChatFullScreenViewer.Root
        onClose={() => {}}
        url={SAMPLE_IMAGE_1}
        mediaType="image"
        senderName="John Doe"
        senderAvatar={SAMPLE_AVATAR}
        senderStatus="Online"
        sentAt="Today at 2:30 pm"
      />
    </ViewerWrapper>
  ),
};

/** Single video display with HTML5 controls. */
export const SingleVideo: Story = {
  render: () => (
    <ViewerWrapper>
      <CometChatFullScreenViewer.Root
        onClose={() => {}}
        url={SAMPLE_VIDEO}
        mediaType="video"
        fileName="big-buck-bunny.mp4"
        fileSize={15728640}
        senderName="Jane Smith"
      />
    </ViewerWrapper>
  ),
};

/** Single file preview with download button. */
export const SingleFile: Story = {
  render: () => (
    <ViewerWrapper>
      <CometChatFullScreenViewer.Root
        onClose={() => {}}
        url={SAMPLE_FILE}
        mediaType="file"
        fileName="quarterly-report.pdf"
        fileSize={2097152}
        senderName="Bob"
        onDownload={url => console.log('Download:', url)}
      />
    </ViewerWrapper>
  ),
};

/** Image gallery with navigation. */
export const GalleryMode: Story = {
  render: () => {
    const attachments: CometChatMediaAttachment[] = [
      { url: SAMPLE_IMAGE_1, type: 'image', name: 'landscape-1.jpg', size: 245000 },
      { url: SAMPLE_IMAGE_2, type: 'image', name: 'landscape-2.jpg', size: 312000 },
      { url: SAMPLE_VIDEO, type: 'video', name: 'clip.mp4', size: 5242880 },
      { url: SAMPLE_IMAGE_3, type: 'image', name: 'landscape-3.jpg', size: 198000 },
      { url: SAMPLE_FILE, type: 'file', name: 'document.pdf', size: 1048576 },
    ];

    return (
      <ViewerWrapper>
        <CometChatFullScreenViewer.Root
          onClose={() => {}}
          attachments={attachments}
          startIndex={0}
          senderName="Team Chat"
          senderAvatar={SAMPLE_AVATAR}
          onIndexChange={i => console.log('Index:', i)}
          onDownload={a => console.log('Download:', a)}
        />
      </ViewerWrapper>
    );
  },
};

/** Minimal viewer without sender info. */
export const NoSenderInfo: Story = {
  render: () => (
    <ViewerWrapper>
      <CometChatFullScreenViewer.Root onClose={() => {}} url={SAMPLE_IMAGE_1} mediaType="image" />
    </ViewerWrapper>
  ),
};
