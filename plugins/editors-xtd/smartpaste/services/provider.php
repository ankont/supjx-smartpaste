<?php
/**
 * @package     SmartPaste
 * @subpackage  plg_editors-xtd_smartpaste
 */

defined('_JEXEC') or die;

use Joomla\CMS\Extension\PluginInterface;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;
use SuperSoft\Plugin\EditorsXtd\SmartPaste\Extension\SmartPaste;

return new class implements ServiceProviderInterface {
    public function register(Container $container): void
    {
        $container->set(
            PluginInterface::class,
            function (Container $container) {
                $plugin = new SmartPaste(
                    (array) PluginHelper::getPlugin('editors-xtd', 'smartpaste')
                );

                $plugin->setApplication(Factory::getApplication());

                return $plugin;
            }
        );
    }
};
