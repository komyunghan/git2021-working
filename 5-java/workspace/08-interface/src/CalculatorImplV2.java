
public class CalculatorImplV2 implements Calculator {

	@Override
	public int plus(int a, int b) {
		return a + b;
	}

	@Override
	public int minus(int a, int b) {
		return a - b;
	}

	@Override
	public double areaCircle(int r) {
		// TODO Auto-generated method stub
		return 3.14 * r * r;
	}
}