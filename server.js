const opentelemetry = require('@opentelemetry/api');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');

const { diag, DiagConsoleLogger, DiagLogLevel } = opentelemetry
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const provider = new BasicTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'otel-span-generator',
  }),
});

const url = process.env.OTLP_GRPC_ENDPOINT
	? `http://${process.env.OTLP_GRPC_ENDPOINT}/`
	: 'http://localhost:4317/'
console.log(`Connecting to ${url}`);
const exporter = new OTLPTraceExporter({ url });

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

provider.register();
process.on('SIGTERM', () => {
  provider.shutdown().then(() => console.log("provider shut down successfully")).catch(console.error)
});

const tracer = opentelemetry.trace.getTracer('otel-example-tracer');

setInterval(async () => {
  tracer.startActiveSpan('main', async span => {
    span.setAttribute('key', 'value');

    await new Promise(resolve => setTimeout(resolve, 500));

    span.addEvent('a thing happened!');
    span.setStatus({ code: opentelemetry.SpanStatusCode.OK});
    span.end();
  });
}, process.env.SPAN_INTERVAL || 10_000);
