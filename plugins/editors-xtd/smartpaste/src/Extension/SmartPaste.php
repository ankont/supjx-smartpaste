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

        $document->addScriptOptions(
            self::SCRIPT_OPTIONS_KEY,
            [
                'defaultInsertText' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_DEFAULT_INSERT_TEXT'),
                'strings' => [
                    'modalTitle' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_TITLE'),
                    'modalIntro' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_INTRO'),
                    'modalNote' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_NOTE'),
                    'textareaLabel' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_SOURCE_LABEL'),
                    'textareaPlaceholder' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_SOURCE_PLACEHOLDER'),
                    'cancel' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_CANCEL'),
                    'insert' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_INSERT'),
                    'close' => Text::_('PLG_EDITORS-XTD_SMARTPASTE_MODAL_CLOSE'),
                ],
            ]
        );

        $wa->useScript('editors');
        $document->addStyleSheet($mediaBase . '/smartpaste-editor.css');
        $document->addCustomTag(
            '<script type="module" src="'
            . htmlspecialchars($mediaBase . '/smartpaste-editor.js?v=0.1.3', ENT_COMPAT, 'UTF-8')
            . '"></script>'
        );

        $loaded = true;
    }
}
