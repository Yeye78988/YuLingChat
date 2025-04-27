package com.jiwuchat.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.ActivityInfo
import android.os.Bundle
import android.webkit.WebView
import androidx.activity.result.contract.ActivityResultContracts

class MainActivity : TauriActivity() {

  private val requestPermissionLauncher =
    registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
      permissions.entries.forEach { entry ->
        val permissionName = entry.key
        val isGranted = entry.value
        // 添加权限结果处理逻辑
        if (!isGranted) {
          // 安卓提醒toast

        }
      }
    }

  @SuppressLint("SetJavaScriptEnabled")
  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    
    with(webView.settings) {
      // 字体不可缩放
      textZoom = 100
      saveFormData = false
      savePassword = false
      // 可以添加其他WebView设置
      javaScriptEnabled = true
      domStorageEnabled = true
      // 提高WebView性能
      setRenderPriority(WebSettings.RenderPriority.HIGH)
      cacheMode = WebSettings.LOAD_DEFAULT
    }
    
    // 清除表单数据
    webView.clearFormData()
  }

  @SuppressLint("SourceLockedOrientationActivity")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    // 请求权限
    requestPermissions()
  }

  private fun requestPermissions() {
    val requiredPermissions = arrayOf(
      Manifest.permission.RECORD_AUDIO,
      Manifest.permission.CAMERA,
      Manifest.permission.WRITE_EXTERNAL_STORAGE,
      Manifest.permission.READ_EXTERNAL_STORAGE,
      Manifest.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
      Manifest.permission.FOREGROUND_SERVICE
    )
    
    requestPermissionLauncher.launch(requiredPermissions)
  }
}
