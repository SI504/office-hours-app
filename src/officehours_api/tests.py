from unittest import mock

from django.test import TestCase, TransactionTestCase

from officehours_api.models import User, Queue, Meeting


class NotificationTestCase(TransactionTestCase):
    def setUp(self):
        self.foo = User.objects.create(username='foo', email='foo@example.com')
        self.foo.profile.phone_number = '+15555550000'
        self.foo.profile.save()
        self.bar = User.objects.create(username='bar', email='bar@example.com')
        self.bar.profile.phone_number = '+15555550001'
        self.bar.profile.save()
        self.baz = User.objects.create(username='baz', email='baz@example.com')
        self.baz.profile.phone_number = '+15555550002'
        self.baz.profile.save()
        self.hostie = User.objects.create(username='hostie', email='hostie@example.com')
        self.hostie.profile.phone_number = '+15555551111'
        self.hostie.profile.save()
        self.hostacular = User.objects.create(username='hostacular', email='hostacular@example.com')
        self.hostacular.profile.phone_number = '+15555552222'
        self.hostacular.profile.save()
        self.queue = Queue.objects.create(
            name='NotificationTest',
        )
        self.queue.hosts.set([self.hostie, self.hostacular])
        self.queue.save()

    def create_meeting(self, attendees):
        m = Meeting.objects.create(
            queue=self.queue,
            backend_type='inperson',
        )
        m.attendees.set(attendees)
        return m

    @staticmethod
    def get_receivers(mock_twilio: mock.MagicMock):
        return {c.kwargs['to'] for c in mock_twilio.mock_calls if 'to' in c.kwargs}

    @mock.patch('officehours_api.notifications.twilio')
    def test_first_meeting_notifies_hosts(self, mock_twilio: mock.MagicMock):
        self.create_meeting([self.foo, self.bar, self.baz])
        self.assertEqual(mock_twilio.messages.create.call_count, 2)
        receivers = self.get_receivers(mock_twilio)
        self.assertTrue(
            receivers >=
            {'+15555551111','+15555552222',}
        )

    @mock.patch('officehours_api.notifications.twilio')
    def test_first_meeting_doesnt_notify_attendees(self, mock_twilio: mock.MagicMock):
        self.create_meeting([self.foo, self.bar, self.baz])
        receivers = self.get_receivers(mock_twilio)
        self.assertFalse(
            receivers >=
            {'+15555550000', '+15555550001', '+15555550002',}
        )

    @mock.patch('officehours_api.notifications.twilio')
    def test_second_meeting_doesnt_notify_hosts(self, mock_twilio: mock.MagicMock):
        self.create_meeting([self.foo,])
        mock_twilio.reset_mock()
        self.create_meeting([self.bar, self.baz,])
        receivers = self.get_receivers(mock_twilio)
        self.assertFalse(
            receivers >=
            {'+15555551111', '+15555552222',}
        )

    @mock.patch('officehours_api.notifications.twilio')
    def test_first_meeting_removal_notifies_next_in_line(self, mock_twilio: mock.MagicMock):
        m1 = self.create_meeting([self.foo,])
        self.create_meeting([self.bar, self.baz])
        mock_twilio.reset_mock()
        m1.delete()
        print(mock_twilio.mock_calls)
        receivers = self.get_receivers(mock_twilio)
        print(receivers)
        self.assertTrue(
            receivers >=
            {'+15555550001', '+15555550002',}
        )

    @mock.patch('officehours_api.notifications.twilio')
    def test_second_meeting_removal_notifies_none(self, mock_twilio: mock.MagicMock):
        self.create_meeting([self.foo,])
        m2 = self.create_meeting([self.bar, self.baz])
        mock_twilio.reset_mock()
        m2.delete()
        receivers = self.get_receivers(mock_twilio)
        self.assertFalse('+15555550001' in receivers)
        self.assertFalse('+15555550002' in receivers)

    @mock.patch('officehours_api.notifications.twilio')
    def test_first_meeting_removal_doesnt_notify_second_in_line(self, mock_twilio: mock.MagicMock):
        m1 = self.create_meeting([self.foo,])
        self.create_meeting([self.bar,])
        self.create_meeting([self.baz,])
        mock_twilio.reset_mock()
        m1.delete()
        receivers = self.get_receivers(mock_twilio)
        self.assertFalse('+15555550002' in receivers)
