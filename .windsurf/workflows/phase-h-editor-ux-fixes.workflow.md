# Workflow: Phase H — Editor UX Fixes

## Goal

Fix critical editor usability issues including keyboard shortcuts, multi-selection, comment toggling, language detection, tab behavior, markdown preview, and file tab styling.

## Steps

1. **Fix Backspace and Multi-Selection Deletion**
   - Investigate Monaco editor deletion behavior
   - Ensure backspace works for single character deletion
   - Fix multi-selection deletion (Ctrl+D selections)
   - Test with various selection scenarios

2. **Fix Bulk Comment/Uncomment**
   - Implement Ctrl+/ or Cmd+/ toggle comment functionality
   - Ensure it works for single line and multi-line selections
   - Support different comment styles for different languages
   - Add keyboard shortcut binding in Monaco

3. **Show File Language in Bottom Right**
   - Add language indicator component in status bar
   - Display current file's detected language
   - Update language indicator when file changes
   - Style to match IDE status bar conventions

4. **Allow Manual Language Selection**
   - Add language selector dropdown in status bar
   - Allow user to override auto-detected language
   - Persist language preference per file
   - Update Monaco editor language model on selection

5. **Fix Arrow Key Navigation**
   - Investigate why arrow keys (up/down/left/right) are not working
   - Check for conflicting keyboard event handlers
   - Ensure Monaco editor receives arrow key events
   - Test navigation in different editor states

6. **Fix Tab Key Horizontal Split**
   - Investigate why Tab key triggers horizontal split
   - Remove or reconfigure Tab key binding
   - Ensure Tab key inserts indentation as expected
   - Add proper tab/indentation behavior

7. **Markdown Preview on Open**
   - Auto-open markdown preview when .md file is first opened
   - Implement double-click in preview to switch to edit mode
   - Add toggle between preview and edit modes
   - Ensure smooth transition between modes

8. **File Tab Italic Styling**
   - Style active/first-opened file tab as italic
   - Remove italic from previous tab when new file is clicked
   - Support double-click and middle-click (mouse3) tab switching
   - Ensure visual feedback for active file

9. **Test All Fixes Together**
   - Verify keyboard shortcuts work correctly
   - Test multi-selection and deletion
   - Test comment toggling across different file types
   - Test language detection and manual override
   - Test arrow key navigation
   - Test tab key behavior
   - Test markdown preview and edit mode switching
   - Test file tab styling and switching

## Success Criteria

- Backspace deletes single characters and multi-selections correctly
- Comment/uncomment works with Ctrl+/ or Cmd+/
- File language displays in bottom right status bar
- Language can be manually changed via dropdown
- Arrow keys navigate cursor properly
- Tab key inserts indentation without splitting
- Markdown files open with preview, double-click switches to edit
- Active file tab shows italic styling, switches on file change
- All fixes work together without conflicts
