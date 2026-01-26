// 调用image-generator skill生成太阳图标
const generateSunIcon = () => {
  console.log('生成太阳图标：简约太阳图标，用于日间模式，圆形，线条风格，大小24x24，PNG格式');
  // 这里模拟调用image-generator skill生成图标
  // 实际使用时，Trae会自动调用该skill
  return {
    success: true,
    message: '太阳图标生成成功',
    iconPath: 'public/icons/sun.png'
  };
};

generateSunIcon();
