<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/shared/dash/Helpers.php';

function VerifierAdresseMail($adresse)
{
    $Syntaxe = '#^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,6}$#';

    return (bool) preg_match($Syntaxe, (string) $adresse);
}

function _make_url_clickable_cb($matches)
{
    $ret = '';
    $url = $matches[2];

    if ($url === '') {
        return $matches[0];
    }
    if (in_array(substr($url, -1), ['.', ',', ';', ':'], true)) {
        $ret = substr($url, -1);
        $url = substr($url, 0, -1);
    }

    return $matches[1] . '<a href="' . $url . '" rel="nofollow" target="_blank">' . $url . '</a>' . $ret;
}

function _make_web_ftp_clickable_cb($matches)
{
    $ret = '';
    $dest = 'http://' . $matches[2];

    if ($dest === 'http://') {
        return $matches[0];
    }
    if (in_array(substr($dest, -1), ['.', ',', ';', ':'], true)) {
        $ret = substr($dest, -1);
        $dest = substr($dest, 0, -1);
    }

    return $matches[1] . '<a href="' . $dest . '" rel="nofollow" target="_blank">' . $dest . '</a>' . $ret;
}

function _make_email_clickable_cb($matches)
{
    $email = $matches[2] . '@' . $matches[3];

    return $matches[1] . '<a href="mailto:' . $email . '">' . $email . '</a>';
}

function make_clickable($ret)
{
    $ret = ' ' . $ret;
    $ret = preg_replace_callback('#([\s>])([\w]+?://[\w\\x80-\\xff\#$%&~/.\-;:=,?@\[\]+]*)#is', '_make_url_clickable_cb', $ret);
    $ret = preg_replace_callback('#([\s>])((www|ftp)\.[\w\\x80-\\xff\#$%&~/.\-;:=,?@\[\]+]*)#is', '_make_web_ftp_clickable_cb', $ret);
    $ret = preg_replace_callback('#([\s>])([.0-9a-z_+-]+)@(([0-9a-z-]+\.)+[0-9a-z]{2,})#i', '_make_email_clickable_cb', $ret);
    $ret = preg_replace("#(<a( [^>]+?>|>))<a [^>]+?>([^>]+?)</a></a>#i", '$1$3</a>', $ret);

    return trim($ret);
}
