const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');

async function checkLatestMeetingTranscription() {
  try {
    await mongoose.connect('mongodb+srv://techfuturepodsuddit:uddit@cluster0.f3fzm4.mongodb.net/richieat?retryWrites=true&w=majority&appName=Cluster0');
    
    console.log('🔍 CHECKING LATEST MEETING TRANSCRIPTION:');
    console.log('========================================\n');
    
    // Find the most recent meeting
    const latestMeeting = await Meeting.findOne().sort({ createdAt: -1 });
    
    if (!latestMeeting) {
      console.log('❌ No meetings found');
      process.exit(1);
    }
    
    console.log('📋 Latest Meeting Details:');
    console.log('Meeting ID:', latestMeeting._id);
    console.log('Room Name:', latestMeeting.roomName);
    console.log('Status:', latestMeeting.status);
    console.log('Created:', latestMeeting.createdAt);
    console.log('\n🎙️ Transcription Status:');
    console.log('Status:', latestMeeting.transcript.status);
    console.log('Instance ID:', latestMeeting.transcript.instanceId || 'None');
    console.log('Messages Count:', latestMeeting.transcript.realTimeMessages.length);
    console.log('Started At:', latestMeeting.transcript.startedAt || 'Not started');
    console.log('Language:', latestMeeting.transcript.language);
    console.log('Model:', latestMeeting.transcript.model);
    
    if (latestMeeting.transcript.realTimeMessages.length > 0) {
      console.log('\n💬 Transcript Messages:');
      latestMeeting.transcript.realTimeMessages.forEach((msg, index) => {
        console.log(`Message ${index + 1}:`);
        console.log(`  Speaker: ${msg.participantName}`);
        console.log(`  Text: ${msg.text}`);
        console.log(`  Time: ${msg.timestamp}`);
        console.log(`  Final: ${msg.isFinal}`);
        console.log(`  Confidence: ${msg.confidence}`);
        console.log('  ---');
      });
    } else {
      console.log('\n❌ No transcript messages found');
    }
    
    if (latestMeeting.transcript.finalTranscript) {
      console.log('\n📄 Final Transcript:');
      console.log(latestMeeting.transcript.finalTranscript);
    }
    
    console.log('\n🎯 Instructions for Testing:');
    console.log('1. Join the meeting using the dashboard');
    console.log('2. Click "Start Recording" button');
    console.log('3. Speak clearly for 10-15 seconds');
    console.log('4. Run this script again to check if data was saved');
    console.log('\n💻 Meeting ID to test:', latestMeeting._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLatestMeetingTranscription();