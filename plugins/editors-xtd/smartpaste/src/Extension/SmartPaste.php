<?php
/**
 * @package     SmartPaste
 * @subpackage  plg_editors-xtd_smartpaste
 */

namespace SuperSoft\Plugin\EditorsXtd\SmartPaste\Extension;

\defined('_JEXEC') or die;

use Joomla\CMS\Editor\Button\Button;
use Joomla\CMS\Event\Editor\EditorButtonsSetupEvent;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Uri\Uri;
use Joomla\Event\SubscriberInterface;

final class SmartPaste extends CMSPlugin implements SubscriberInterface
{
    private const VERSION = '0.2.0';
    private const SCRIPT_OPTIONS_KEY = 'plg_editors_xtd_smartpaste';

    protected $autoloadLanguage = true;

    public static function getSubscribedEvents(): array
    {
        return [
            'onEditorButtonsSetup' => 'onEditorButtonsSetup',
        ];
    }

    public function onEditorButtonsSetup(EditorButtonsSetupEvent $event): void
    {
        if (!Factory::getApplication()->isClient('administrator')) {
            return;
        }

        $registry = $event->getButtonsRegistry();
        $disabled = $event->getDisabledButtons();

        if (\in_array('smartpaste', $disabled, true)) {
            return;
        }

        $this->loadLanguage();
        $this->loadAssets();

        $button = new Button(
            'smartpaste',
            [
                'text' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_BUTTON'),
                'icon' => 'clipboard',
                'action' => 'supersoft-smartpaste',
            ],
            [
                'editorId' => $event->getEditorId(),
            ]
        );

        $registry->add($button);
    }

    private function loadAssets(): void
    {
        static $loaded = false;

        if ($loaded) {
            return;
        }

        $document = Factory::getApplication()->getDocument();

        if (!method_exists($document, 'getWebAssetManager')
            || !method_exists($document, 'addScriptOptions')
            || !method_exists($document, 'addStyleSheet')
            || !method_exists($document, 'addCustomTag')) {
            return;
        }

        $wa = $document->getWebAssetManager();
        $mediaBase = rtrim(Uri::root(true), '/') . '/media/plg_editors_xtd_smartpaste';
        $versionSuffix = '?v=' . rawurlencode(self::VERSION);

        $document->addScriptOptions(self::SCRIPT_OPTIONS_KEY, $this->getWorkspaceOptions());

        $wa->useScript('editors');
        $document->addStyleSheet($mediaBase . '/smartpaste-editor.css' . $versionSuffix);
        $document->addCustomTag(
            '<script type="module" src="'
            . htmlspecialchars($mediaBase . '/smartpaste-editor.js' . $versionSuffix, ENT_COMPAT, 'UTF-8')
            . '"></script>'
        );

        $loaded = true;
    }

    /**
     * @return array<string, mixed>
     */
    private function getWorkspaceOptions(): array
    {
        return [
            'strings' => [
                'title' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_TITLE'),
                'intro' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_WORKSPACE_INTRO'),
                'note' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_WORKSPACE_NOTE'),
                'selectionLoaded' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_SELECTION_LOADED'),
                'pasteLabel' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_PASTE_LABEL'),
                'pasteHint' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_PASTE_HINT'),
                'pastePlaceholder' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_PASTE_PLACEHOLDER'),
                'htmlLabel' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_HTML_LABEL'),
                'htmlHint' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_HTML_HINT'),
                'analysisTitle' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_ANALYSIS_TITLE'),
                'analysisEmpty' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_ANALYSIS_EMPTY'),
                'unsafeNotice' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_UNSAFE_NOTICE'),
                'optionsTitle' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OPTIONS_TITLE'),
                'previewTitle' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_PREVIEW_TITLE'),
                'previewEmpty' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_PREVIEW_EMPTY'),
                'outputLabel' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OUTPUT_LABEL'),
                'outputHint' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OUTPUT_HINT'),
                'buttons' => [
                    'useSelection' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_USE_SELECTION'),
                    'clear' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_CLEAR'),
                    'reset' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_RESET'),
                    'cancel' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_CANCEL'),
                    'insert' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_INSERT_CLEAN'),
                    'close' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_CLOSE'),
                ],
                'counts' => [
                    'styles' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_COUNT_STYLES'),
                    'classes' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_COUNT_CLASSES'),
                    'links' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_COUNT_LINKS'),
                    'images' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_COUNT_IMAGES'),
                    'tables' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_COUNT_TABLES'),
                    'comments' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_COUNT_COMMENTS'),
                    'office' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_COUNT_OFFICE'),
                    'unsafe' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_COUNT_UNSAFE'),
                ],
                'options' => [
                    'keepInlineStyles' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OPT_KEEP_INLINE_STYLES'),
                    'keepClasses' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OPT_KEEP_CLASSES'),
                    'keepLinks' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OPT_KEEP_LINKS'),
                    'keepImages' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OPT_KEEP_IMAGES'),
                    'keepTables' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OPT_KEEP_TABLES'),
                    'removeComments' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OPT_REMOVE_COMMENTS'),
                    'removeOfficeMarkup' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OPT_REMOVE_OFFICE'),
                    'removeEmptySpans' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OPT_REMOVE_EMPTY_SPANS'),
                    'semanticFormatting' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_OPT_SEMANTIC'),
                ],
            ],
        ];
    }
}
